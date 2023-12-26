import Koa from "koa";
import dotenv from "dotenv";
import { getAllRouters } from "./router";
import { ethers } from "ethers";
import { TxSubscriber } from "./tx_subscriber";
import { TxProcessor } from "./tx_processor";
import { Database } from "./database";
import { logger } from "./logger";
import { dbNames } from "./constants";
import { type DBOption } from "./types";

dotenv.config();

async function getApp(): Promise<void> {
  const app = new Koa();
  // TODO(move to config json file)
  const options = {
    serverPort: process.env.SERVER_PORT ?? "3000",
    serverIP: process.env.SERVER_IP ?? "127.0.0.1",
    url: process.env.MAINNET_URL,
    fastSyncBatch: 10, // blocks size
    txSizes: 10, // txs size
    filterTokens: [],
    fromBlock: 18869605 - 1000,
  };

  const provider = new ethers.JsonRpcProvider(options.url);
  const { chainId } = await provider.getNetwork();
  const dbOption: DBOption = {
    dbHost: process.env.DB_HOST ?? "localhost",
    dbName: dbNames[parseInt(chainId.toString())],
    dbUsername: process.env.DB_USERNAME ?? "test",
    dbPasswd: process.env.DB_PASSWD ?? "test",
  };

  const db = new Database();
  await db.connect(dbOption);
  const { subscribedBlockNumber } = await db.getGlobalState();
  const currentBlockNumber = await provider.getBlockNumber();
  console.log(currentBlockNumber);
  const fromBlock = Math.min(
    Math.max(subscribedBlockNumber, options.fromBlock),
    currentBlockNumber,
  );

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
