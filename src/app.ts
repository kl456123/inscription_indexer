import Koa from "koa";
import dotenv from "dotenv";
import { getAllRouters } from "./router";
import { ethers } from "ethers";
import cors from "@koa/cors";
import { TxSubscriber } from "./tx_subscriber";
import { TxProcessor } from "./tx_processor";
import { Database } from "./database";
import { logger } from "./logger";
import { dbNames } from "./constants";
import KoaLogger from "koa-logger";
import { type DBOption } from "./types";
import optionsJson from "../data/config.json";
import * as _ from "lodash";
import { errorHandler } from "./middleware/error_handler";

dotenv.config();

type MultiChainProvider = Record<string, ethers.JsonRpcProvider>;
type MultiChainDatabase = Record<string, Database>;

async function startJobsForMultichain(): Promise<{
  providers: MultiChainProvider;
  databases: MultiChainDatabase;
}> {
  const networks: Record<string, string | undefined> = {
    1: process.env.ETHEREUM_URL,
    43114: process.env.AVALANCHE_URL,
    137: process.env.POLYGON_URL,
  };
  const providers: MultiChainProvider = {};
  const databases: MultiChainDatabase = {};

  const validNetworks = _.omitBy(networks, (item) => _.isNil(item));
  for (const chainId of Object.keys(validNetworks)) {
    const { provider, db } = await startJobsForSingleNetwork(
      chainId,
      validNetworks[chainId]!,
    );
    providers[chainId] = provider;
    databases[chainId] = db;
  }
  return { providers, databases };
}

async function startJobsForSingleNetwork(
  chainId: string,
  url: string,
): Promise<{ provider: ethers.JsonRpcProvider; db: Database }> {
  const options = optionsJson.networks[chainId];
  const provider = new ethers.JsonRpcProvider(url);
  const dbOption: DBOption = {
    dbHost: process.env.DB_HOST ?? "localhost",
    dbName: dbNames[chainId],
    dbUsername: process.env.DB_USERNAME ?? "test",
    dbPasswd: process.env.DB_PASSWD ?? "test",
  };
  const db = new Database();
  await db.connect(dbOption);
  const { subscribedBlockNumber } = await db.getGlobalState();
  const currentBlockNumber = await provider.getBlockNumber();
  const fromBlock = Math.min(
    Math.max(subscribedBlockNumber, options.fromBlock ?? currentBlockNumber),
    currentBlockNumber,
  );

  logger.info(`start ${dbNames[chainId]} work from blockNumber: ${fromBlock}`);

  // fetch txs and save to db
  const txSubscriber = new TxSubscriber(provider, db, options.fastSyncBatch);
  txSubscriber.start(fromBlock).catch((error) => {
    logger.error(error);
  });

  // process all saved txs in db
  const txProcessor = new TxProcessor(db, options.txSizes);
  txProcessor.start();
  return { provider, db };
}

async function getApp(): Promise<void> {
  const app = new Koa();
  const { databases } = await startJobsForMultichain();
  app.use(cors());
  app.use(KoaLogger());
  app.use(errorHandler);
  const router = getAllRouters(databases);
  app.use(router.routes());
  app.listen(parseInt(optionsJson.serverPort), optionsJson.serverIP);
}

getApp().catch((error) => {
  logger.error(error);
});
