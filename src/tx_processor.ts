import { Database } from "./database";
import {
  Transaction,
  Inscription,
  Token,
  Deploy,
  Transfer,
  Mint,
} from "./types";
import { logger } from "./logger";

export class TxProcessor {
  constructor(
    protected db: Database,
    protected txSizes: number = 20,
  ) {}

  processTx(txs: Transaction[]) {
    while (txs.length > 0) {
      const tx = txs.pop()!;
      // remove prefix
      const data = tx.data.slice(0, 12);
      data.trimStart();
      if (data[0] == "{") {
        const jsonData = JSON.parse(data);
        // protocol type
        const protocol = jsonData["p"];
        if (protocol == "asc-20") {
          const operation = jsonData["op"];
          let valid;
          switch (operation) {
            case "deploy": {
              valid = this.processDeployOperation(tx, jsonData);
              break;
            }
            case "mint": {
              valid = this.processMintOperation(tx, jsonData);
              break;
            }
            case "transfer": {
              valid = this.processTransferOperation(tx, jsonData);
              break;
            }
            default: {
              valid = false;
            }
          }
          const inscription: Inscription = {
            id: this.db.inscriptionNumber,
            txHash: tx.txHash,
            protocol: jsonData["p"],
            from: tx.from,
            to: tx.to,
            timestamp: tx.timestamp,
            content: tx.data,
            contentType: "text/plain",
            valid,
          };
          this.db.inscriptions.push(inscription);
        }
      } else {
        logger.error("parse error, skip it");
      }
    }
  }

  // data:,{"p":"asc-20","op":"deploy","tick":"avav","max":"1463636349000000","lim":"69696969"}
  processDeployOperation(tx: Transaction, jsonData: any): boolean {
    // check if it is deployed already
    if (this.db.tokens.hasOwnProperty(jsonData["tick"])) {
      // invalid inscription
      logger.error("deployed already");
      return false;
    }

    const token: Token = {
      tick: jsonData["tick"],
      id: this.db.inscriptionNumber,
      max: jsonData["max"],
      limit: jsonData["lim"],
      minted: 0,
      holders: 0,
      numTxs: 0,
      createdAt: tx.timestamp,
      completedAt: 0,
    };

    this.db.tokens[token.tick] = token;
    this.db.inscriptionNumber++;
    return true;
  }

  // data:,{"p":"asc-20","op":"mint","tick":"dino","amt":"100000000"}
  processMintOperation(tx: Transaction, jsonData: any): boolean {
    const tick = jsonData["tick"];
    const balances = this.db.balances[tx.to];
    if (!this.db.tokens.hasOwnProperty(tick)) {
      logger.error(`invalid tick`);
      return false;
    }
    const amt = jsonData["amt"];
    const tokenInfo = this.db.tokens[tick];
    if (amt > tokenInfo.limit) {
      logger.error(`mint too many tokens once time`);
      return false;
    }
    if (amt + tokenInfo.minted > tokenInfo.max) {
      logger.error(`exceed tokens amount limit`);
      return false;
    }

    if (balances.hasOwnProperty(tick)) {
      balances[tick] += amt;
    } else {
      // new holder
      balances[tick] = amt;
      tokenInfo.holders += 1;
    }
    tokenInfo.minted += amt;
    tokenInfo.numTxs++;
    if (tokenInfo.minted == tokenInfo.max) {
      tokenInfo.completedAt = tx.timestamp;
    }
    return true;
  }

  // data:,{"p":"asc-20","op":"transfer","tick":"dino","amt":"100000000"}
  processTransferOperation(tx: Transaction, jsonData: any): boolean {
    // check valid token
    const tick = jsonData["tick"];
    if (!this.db.tokens.hasOwnProperty(tick)) {
      logger.error(`invalid tick`);
      return false;
    }
    const tokenInfo = this.db.tokens[tick];
    const amt = jsonData["amt"];
    if (amt === 0) {
      logger.warn(`send nothing`);
      return false;
    }
    if (tx.from === tx.to) {
      logger.warn(`send to self`);
      return false;
    }
    // check from
    const fromBalance = this.db.balances[tx.from];
    const toBalance = this.db.balances[tx.to];
    if (fromBalance[tick] < amt) {
      logger.error(`exceed from account balance`);
      return false;
    }
    // update db
    fromBalance[tick] -= amt;
    if (fromBalance[tick] == 0) {
      tokenInfo.holders--;
    }
    if (toBalance[tick] == 0) {
      tokenInfo.holders++;
    }
    toBalance[tick] += amt;
    return true;
  }

  start() {
    setInterval(() => {
      // consume all txs from db
      if (this.db.txs.length >= this.txSizes) {
        this.processTx(this.db.txs);
      }
    }, 5000);
  }
}
