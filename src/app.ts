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
    ethereum: process.env.ETHEREUM_URL,
    avalanche: process.env.AVALANCHE_URL,
    polygon: process.env.POLYGON_URL,
  };
  const providers: MultiChainProvider = {};
  const databases: MultiChainDatabase = {};

  const validNetworks = _.omitBy(networks, (item) => _.isNil(item));
  for (const networkName of Object.keys(validNetworks)) {
    const { provider, db } = await startJobsForSingleNetwork(
      networkName,
      validNetworks[networkName]!,
    );
    providers[networkName] = provider;
    databases[networkName] = db;
  }
  return { providers, databases };
}

async function startJobsForSingleNetwork(
  networkName: string,
  url: string,
): Promise<{ provider: ethers.JsonRpcProvider; db: Database }> {
  const options = optionsJson.networks[networkName];
  const provider = new ethers.JsonRpcProvider(url);
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
  const fromBlock = Math.min(
    Math.max(subscribedBlockNumber, options.fromBlock ?? currentBlockNumber),
    currentBlockNumber,
  );

  logger.info(`start ${networkName} work from blockNumber: ${fromBlock}`);

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
  app.use(errorHandler);
  const router = getAllRouters(databases);
  app.use(router.routes());
  app.listen(parseInt(optionsJson.serverPort), optionsJson.serverIP);
}

getApp().catch((error) => {
  logger.error(error);
});
