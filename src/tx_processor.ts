import { type Database } from "./database";
import { BigNumber } from "bignumber.js";
import { setIntervalAsync } from "set-interval-async";
import { InscriptionEntity, TokenEntity, GlobalStateEntity } from "./entities";
import { serializeBalance, deserializeToken, serializeToken } from "./utils";
import { type Transaction, type Inscription, type Token } from "./types";
import { logger } from "./logger";

export class TxProcessor {
  constructor(
    protected db: Database,
    protected chainId: number,
    protected inscriptionNumber: number,
    protected txSizes: number = 20,
  ) {}

  async processTx(txs: Transaction[]): Promise<void> {
    txs.reverse();
    while (txs.length > 0) {
      const tx = txs.pop()!;
      // remove prefix
      const data = Buffer.from(tx.data.slice(2), "hex").toString();
      const index = data.indexOf(",");
      if (index === -1) {
        logger.debug(
          `parse inscription in txHash(${tx.txHash}) error, skip it`,
        );
        continue;
      }
      // parse content type
      let contentType = "text/plain";
      if (index > 5) {
        contentType = data.slice(0, index);
      }
      // skip commas
      const content = data.slice(index + 1).trimStart();
      try {
        const jsonData = JSON.parse(content);
        // protocol type
        const protocol = jsonData.p;
        if (protocol === "asc-20") {
          const operation = jsonData.op;
          let entities: any[];
          if (await this.db.checkInscriptionExistByTxHash(tx.txHash)) {
            logger.debug("parsed already, skip it");
            // processed already
            continue;
          }
          switch (operation) {
            case "deploy": {
              entities = await this.processDeployOperation(tx, jsonData);
              break;
            }
            case "mint": {
              entities = await this.processMintOperation(tx, jsonData);
              break;
            }
            case "transfer": {
              entities = await this.processTransferOperation(tx, jsonData);
              break;
            }
            default: {
              entities = [];
            }
          }
          const inscription: Inscription = {
            id: this.inscriptionNumber++,
            chainId: this.chainId,
            txHash: tx.txHash,
            protocol,
            from: tx.from,
            to: tx.to,
            timestamp: tx.timestamp,
            content,
            contentType,
            valid: entities.length !== 0,
          };
          await this.db.connection.manager.transaction(
            async (transactionEntityManager) => {
              await transactionEntityManager.save(
                new InscriptionEntity(inscription),
              );
              await transactionEntityManager.save(entities);
              await transactionEntityManager.save(
                new GlobalStateEntity({
                  chainId: this.chainId,
                  processedTxId: tx.txId! + 1,
                  inscriptionNumber: this.inscriptionNumber,
                }),
              );

              // no need to sweep the processed tx
            },
          );
        } else {
          logger.debug(
            `parse unknown protocol ${protocol} in txHash(${tx.txHash}) error, skip it`,
          );
          // we should better not remove new protocol of inscription
          // await this.db.removeTransaction(tx);
        }
      } catch {
        logger.debug(
          `parse ${content} inscription in txHash(${tx.txHash}) error, skip it`,
        );

        // remove invalid tx
        await this.db.removeTransaction(tx);
      }
    }
  }

  // data:,{"p":"asc-20","op":"deploy","tick":"avav","max":"1463636349000000","lim":"69696969"}
  async processDeployOperation(tx: Transaction, jsonData: any): Promise<any[]> {
    // check if it is deployed already
    const tick = jsonData.tick;
    const exist = await this.db.checkTokenExistByTickName(tick);
    if (exist) {
      // invalid inscription
      logger.error("deployed already");
      return [];
    }
    logger.info(`find new token: ${tick}`);

    const max = new BigNumber(jsonData.max);
    const minted = new BigNumber(0);
    const progress = minted.div(max);
    const token: Token = {
      id: this.inscriptionNumber,
      chainId: this.chainId,
      tick,
      protocol: jsonData.p,
      max,
      minted,
      limit: new BigNumber(jsonData.lim),
      progress,
      holders: 0,
      numTxs: 0,
      createdAt: tx.timestamp,
      completedAt: 0,
    };

    return [serializeToken(token)];
  }

  // data:,{"p":"asc-20","op":"mint","tick":"dino","amt":"100000000"}
  async processMintOperation(tx: Transaction, jsonData: any): Promise<any[]> {
    const tick = jsonData.tick;
    const tokenEntity = await this.db.connection.manager.findOne(TokenEntity, {
      where: { tick },
    });
    if (tokenEntity == null) {
      logger.debug(`invalid tick ${tick}`);
      return [];
    }
    const tokenInfo = deserializeToken(tokenEntity);
    const amt = new BigNumber(jsonData.amt);
    if (amt.gt(tokenInfo.limit)) {
      logger.debug(`mint too many tokens once time`);
      return [];
    }
    if (amt.plus(tokenInfo.minted).gt(tokenInfo.max)) {
      logger.debug(
        `exceed tokens(${
          tokenInfo.tick
        }) amount limit: (${amt.toString()}+${tokenInfo.minted.toString()}>${tokenInfo.max.toString()})`,
      );
      return [];
    }

    const balance = await this.db.getHolderInfo(this.chainId, {
      tick,
      address: tx.to,
    });
    if (balance.amount.isZero()) {
      // new holder
      tokenInfo.holders += 1;
    }
    balance.amount = balance.amount.plus(amt);

    // update token info
    tokenInfo.minted = tokenInfo.minted.plus(amt);
    tokenInfo.progress = tokenInfo.minted.div(tokenInfo.max);
    tokenInfo.numTxs++;
    if (tokenInfo.minted.eq(tokenInfo.max)) {
      tokenInfo.completedAt = tx.timestamp;
    }

    // update db
    return [serializeToken(tokenInfo), serializeBalance(balance)];
  }

  // data:,{"p":"asc-20","op":"transfer","tick":"dino","amt":"100000000"}
  async processTransferOperation(
    tx: Transaction,
    jsonData: any,
  ): Promise<any[]> {
    // check valid token
    const tick = jsonData.tick;
    const tokenEntity = await this.db.connection.manager.findOne(TokenEntity, {
      where: { tick },
    });
    if (tokenEntity == null) {
      logger.debug(`invalid tick ${tick}`);
      return [];
    }
    const tokenInfo = deserializeToken(tokenEntity);
    const amt = new BigNumber(jsonData.amt);
    if (amt.isZero()) {
      logger.warn(`send nothing`);
      return [];
    }
    if (tx.from === tx.to) {
      logger.warn(`send to self`);
      return [];
    }
    // check from
    const fromBalance = await this.db.getHolderInfo(this.chainId, {
      tick,
      address: tx.from,
    });
    const toBalance = await this.db.getHolderInfo(this.chainId, {
      tick,
      address: tx.to,
    });

    if (fromBalance.amount.lt(amt)) {
      logger.debug(`exceed from account balance`);
      return [];
    }
    // update db
    fromBalance.amount = fromBalance.amount.minus(amt);
    if (fromBalance.amount.isZero()) {
      tokenInfo.holders--;
    }
    if (toBalance.amount.isZero()) {
      tokenInfo.holders++;
    }
    toBalance.amount = toBalance.amount.plus(amt);
    // update db
    return [
      serializeBalance(fromBalance),
      serializeBalance(toBalance),
      serializeToken(tokenInfo),
    ];
  }

  start(): void {
    setIntervalAsync(async () => {
      const { processedTxId } = await this.db.getGlobalState(this.chainId);
      // consume all txs from db
      const count = await this.db.getTxCounts(processedTxId);
      if (count > this.txSizes) {
        logger.info(`start processing ${count} txs`);
        for (let page = 1; page * this.txSizes <= count; page += 1) {
          // fetch txs by page
          const txs = await this.db.getTransactions(
            page,
            this.txSizes,
            processedTxId,
            this.chainId,
          );
          await this.processTx(txs);
        }
        logger.info(`${count} txs processed`);
      }
    }, 5000);
  }
}
