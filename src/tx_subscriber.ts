import { type ethers, type Block, type TransactionResponse } from "ethers";
import { logger } from "./logger";
import { type Transaction } from "./types";
import { type Database } from "./database";
import { TransactionEntity } from "./entities";

export class TxSubscriber {
  protected retries: number;
  constructor(
    protected provider: ethers.JsonRpcProvider,
    protected db: Database,
    protected fromBlock: number,
    protected fastSyncBatch: number = 20,
    protected confirmation: number = 2,
  ) {
    this.retries = 2;
  }

  async syncTxsPerBatch(fromBlock: number, toBlock: number): Promise<void> {
    // fetch blocks from the chain parallelly
    const blockPromises: Array<Promise<null | Block>> = [];
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
      blockPromises.push(this.provider.getBlock(blockNum));
    }
    const blocks = await Promise.all(blockPromises);

    const txs: TransactionEntity[] = [];
    for (const block of blocks) {
      // fetch all transactions parallelly
      const txPromises: Array<Promise<null | TransactionResponse>> = [];
      for (const txHash of block!.transactions) {
        txPromises.push(this.provider.getTransaction(txHash));
      }
      const rawTxs = await Promise.all(txPromises);

      for (let i = 0; i < rawTxs.length; ++i) {
        const rawTx = rawTxs[i]!;
        // filter valid inscriptions from block
        // NOTE(ascii("data:")==0x646174613a)
        if (
          rawTx.data.length < 12 ||
          rawTx.data.slice(0, 12) !== "0x646174613a"
        ) {
          continue;
        }
        const tx: Transaction = {
          txHash: block!.transactions[i],
          data: rawTx.data,
          from: rawTx.from,
          to: rawTx.to!,
          blockNumber: rawTx.blockNumber!,
          timestamp: block!.timestamp,
        };
        txs.push(new TransactionEntity(tx));
      }
    }

    await this.db.connection.manager.save(txs);
  }

  async syncTxs(currentBlockNumber: number): Promise<void> {
    // fast-sync
    const toBlock = currentBlockNumber - this.confirmation;
    const fromBlock = this.fromBlock;
    for (let block = fromBlock; block <= toBlock; block += this.fastSyncBatch) {
      const fromBlockPerBatch = block;
      const toBlockPerBatch = Math.min(block + this.fastSyncBatch - 1, toBlock);
      await this.syncTxsPerBatch(fromBlockPerBatch, toBlockPerBatch);

      logger.info(
        `processing logs in range [${fromBlockPerBatch}, ${toBlockPerBatch}]`,
      );
    }
  }

  async start(): Promise<void> {
    while (true) {
      const currentBlockNumber = await this.provider.getBlockNumber();
      await this.syncTxs(currentBlockNumber);
      if (currentBlockNumber - this.fromBlock < this.confirmation) {
        break;
      }
    }

    await this.provider.on("block", (blockTag) => {
      void (async () => {
        if (blockTag >= this.fromBlock + this.confirmation) {
          await this.syncTxs(blockTag);
        }
      })();
    });
  }
}
