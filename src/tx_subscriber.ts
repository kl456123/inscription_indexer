import { ethers } from "ethers";
import { logger } from "./logger";
import { Transaction } from "./types";
import { Database } from "./database";

export class TxSubscriber {
  protected retries: number;
  protected fastSyncBatch: number;
  constructor(
    protected provider: ethers.JsonRpcProvider,
    protected db: Database,
    protected fromBlock: number,
    protected confirmation: number = 2,
  ) {
    this.retries = 2;
    this.fastSyncBatch = 1;
  }

  async syncTxsPerBatch(fromBlock: number, toBlock: number) {
    // parallel subscribe txs from the chain
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
      const block = (await this.provider.getBlock(blockNum))!;
      for (const txHash of block.transactions) {
        const rawTx = (await this.provider.getTransaction(txHash))!;
        // filter inscriptions from block
        // check if ascii("data:")==0x646174613a,
        if (
          rawTx.data.length < 12 ||
          rawTx.data.slice(0, 12) !== "0x646174613a"
        ) {
          continue;
        }
        const block = await this.provider.getBlock(rawTx.blockNumber!);
        const tx: Transaction = {
          txHash,
          data: rawTx.data,
          from: rawTx.from,
          to: rawTx.to!,
          blockNumber: rawTx.blockNumber!,
          timestamp: block!.timestamp,
        };
        this.db.txs.push(tx);
        console.log(tx);
      }
    }
  }

  async syncTxs(currentBlockNumber: number) {
    // fast-sync
    const toBlock = currentBlockNumber - this.confirmation;
    const fromBlock = this.fromBlock;
    for (let block = fromBlock; block <= toBlock; block += this.fastSyncBatch) {
      const fromBlockPerBatch = block;
      const toBlockPerBatch = Math.min(block + this.fastSyncBatch - 1, toBlock);
      const totalVolumeInUSD = await this.syncTxsPerBatch(
        fromBlockPerBatch,
        toBlockPerBatch,
      );

      logger.info(
        `processing logs in range [${fromBlockPerBatch}, ${toBlockPerBatch}]`,
      );
    }
  }

  async start() {
    while (true) {
      const currentBlockNumber = await this.provider.getBlockNumber();
      await this.syncTxs(currentBlockNumber);
      if (currentBlockNumber - this.fromBlock < this.confirmation) {
        break;
      }
    }

    this.provider.on("block", async (blockTag) => {
      if (blockTag >= this.fromBlock + this.confirmation) {
        await this.syncTxs(blockTag);
      }
    });
  }
}
