import { type ethers, type Block, type TransactionResponse } from "ethers";
import { logger } from "./logger";
import { type Transaction } from "./types";
import { type Database } from "./database";
import { TransactionEntity, GlobalStateEntity } from "./entities";

export class TxSubscriber {
  protected retries: number;
  constructor(
    protected provider: ethers.JsonRpcProvider,
    protected db: Database,
    protected fastSyncBatch: number = 20,
    protected confirmation: number = 5,
  ) {
    this.retries = 2;
  }

  async syncTxsPerBatch(fromBlock: number, toBlock: number): Promise<void> {
    // fetch blocks from the chain parallelly
    const blockPromises: Array<Promise<null | Block>> = [];
    for (let blockNum = fromBlock; blockNum < toBlock; blockNum++) {
      blockPromises.push(this.provider.getBlock(blockNum));
    }
    const blocks = await Promise.all(blockPromises);

    const txs: TransactionEntity[] = [];
    for (const block of blocks) {
      if (block === null) {
        logger.info(`get empty block, maybe too fast to sync`);
        break;
      }
      // fetch all transactions parallelly
      const txPromises: Array<Promise<null | TransactionResponse>> = [];
      for (const txHash of block.transactions) {
        txPromises.push(this.provider.getTransaction(txHash));
      }
      const rawTxs = await Promise.all(txPromises);

      for (let i = 0; i < rawTxs.length; ++i) {
        const rawTx = rawTxs[i];
        if (rawTx === null) {
          logger.info(`get empty tx, skip it`);
          continue;
        }
        // only filter txs containing valid inscriptions from block
        // NOTE(ascii("data:")==0x646174613a)
        if (
          rawTx.data.length < 12 ||
          rawTx.data.slice(0, 12) !== "0x646174613a"
        ) {
          continue;
        }
        const tx: Transaction = {
          txHash: block.transactions[i],
          data: rawTx.data,
          from: rawTx.from,
          to: rawTx.to!,
          blockNumber: rawTx.blockNumber!,
          timestamp: block.timestamp,
        };
        txs.push(new TransactionEntity(tx));
      }
    }

    await this.db.connection.manager.transaction(
      async (transactionEntityManager) => {
        await transactionEntityManager.save(txs);
        await transactionEntityManager.save(
          new GlobalStateEntity({ subscribedBlockNumber: toBlock }),
        );
      },
    );
  }

  async syncTxs(fromBlock: number, toBlock: number): Promise<void> {
    // fast-sync
    for (let block = fromBlock; block < toBlock; block += this.fastSyncBatch) {
      const fromBlockPerBatch = block;
      const toBlockPerBatch = Math.min(block + this.fastSyncBatch, toBlock);
      await this.syncTxsPerBatch(fromBlockPerBatch, toBlockPerBatch);

      logger.info(
        `processing logs in range [${fromBlockPerBatch}, ${toBlockPerBatch})`,
      );
    }
  }

  async start(fromBlock: number): Promise<void> {
    // fast sync to the latest block first
    let syncBlock = fromBlock;
    while (true) {
      const currentBlockNumber = await this.provider.getBlockNumber();
      const nextSyncBlock = currentBlockNumber - this.confirmation + 1;
      if (nextSyncBlock <= syncBlock) {
        break;
      }
      await this.syncTxs(syncBlock, nextSyncBlock);
      syncBlock = nextSyncBlock;
    }
    logger.info("sync finished");

    // subscribe every confirmed block
    setInterval(() => {
      void (async () => {
        const blockTag = await this.provider.getBlockNumber();
        const nextSyncBlock = blockTag - this.confirmation + 1;
        if (nextSyncBlock <= syncBlock) return;
        await this.syncTxs(syncBlock, nextSyncBlock);
        syncBlock = nextSyncBlock;
      })();
    }, 5000);
  }
}
