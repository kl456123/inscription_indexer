import Koa from "koa";
import dotenv from "dotenv";
import { getAllRouters } from "./router";
import { ethers } from "ethers";
import { TxSubscriber } from "./tx_subscriber";
import { TxProcessor } from "./tx_processor";
import { Database } from "./database";
import { logger } from "./logger";

dotenv.config();

async function getApp(): Promise<void> {
  const app = new Koa();
  const options = {
    serverPort: process.env.SERVER_PORT ?? "3000",
    serverIP: process.env.SERVER_IP ?? "127.0.0.1",
    url: process.env.MAINNET_URL,
    fastSyncBatch: 50, // blocks size
    txSizes: 50, // txs size
    filterTokens: [],
    fromBlock: 38529642,
  };

  const db = new Database();
  await db.connect();
  const { subscribedBlockNumber } = await db.getGlobalState();
  const provider = new ethers.JsonRpcProvider(options.url);
  const fromBlock = Math.max(subscribedBlockNumber, options.fromBlock);
  // const currentBlockNumber = await provider.getBlockNumber();

  const router = getAllRouters(db);
  app.use(router.routes());
  app.listen(parseInt(options.serverPort), options.serverIP);
  logger.info(`start work from blockNumber: ${fromBlock}`);

  // fetch txs and save to db
  const txSubscriber = new TxSubscriber(
    provider,
    db,
    fromBlock,
    options.fastSyncBatch,
  );
  txSubscriber.start().catch((error) => {
    logger.error(error);
  });

  // process all saved txs in db
  const txProcessor = new TxProcessor(db, options.txSizes);
  txProcessor.start();
}

getApp().catch((error) => {
  logger.error(error);
});
