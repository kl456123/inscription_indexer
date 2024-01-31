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

async function startJobsForMultichain(): Promise<{
  providers: MultiChainProvider;
  database: Database;
  chainIds: number[];
}> {
  const networks: Record<string, string | undefined> = {
    1: process.env.ETHEREUM_URL,
    43114: process.env.AVALANCHE_URL,
    137: process.env.POLYGON_URL,
  };
  const providers: MultiChainProvider = {};
  const dbOption: DBOption = {
    dbHost: process.env.DB_HOST ?? "localhost",
    dbName: process.env.DB_NAME ?? "inscription_indexer",
    dbUsername: process.env.DB_USERNAME ?? "test",
    dbPasswd: process.env.DB_PASSWD ?? "test",
  };
  const db = new Database();
  await db.connect(dbOption);

  const validNetworks = _.omitBy(networks, (item) => _.isNil(item));
  const chainIds = Object.keys(validNetworks).map((chainId) =>
    parseInt(chainId),
  );
  for (const chainId of chainIds) {
    const { provider } = await startJobsForSingleNetwork(
      chainId,
      validNetworks[chainId]!,
      db,
    );
    providers[chainId] = provider;
  }
  return { providers, database: db, chainIds };
}

async function startJobsForSingleNetwork(
  chainId: number,
  url: string,
  db: Database,
): Promise<ethers.JsonRpcProvider> {
  const options = optionsJson.networks[chainId];
  const provider = new ethers.JsonRpcProvider(url);
  const { subscribedBlockNumber } = await db.getGlobalState(chainId);
  const currentBlockNumber = await provider.getBlockNumber();
  const fromBlock = Math.min(
    Math.max(subscribedBlockNumber, options.fromBlock ?? currentBlockNumber),
    currentBlockNumber,
  );

  logger.info(`start ${dbNames[chainId]} work from blockNumber: ${fromBlock}`);

  // fetch txs and save to db
  const txSubscriber = new TxSubscriber(
    provider,
    db,
    chainId,
    options.fastSyncBatch,
  );
  txSubscriber.start(fromBlock).catch((error) => {
    logger.error(error);
  });

  const { inscriptionNumber } = await db.getGlobalState(chainId);
  // process all saved txs in db
  const txProcessor = new TxProcessor(
    db,
    chainId,
    inscriptionNumber,
    options.txSizes,
  );
  txProcessor.start();
  return provider;
}

async function getApp(): Promise<void> {
  const app = new Koa();
  const { database, chainIds } = await startJobsForMultichain();
  app.use(cors());
  app.use(KoaLogger());
  app.use(errorHandler);
  const router = getAllRouters({ database, chainIds });
  app.use(router.routes());
  app.listen(parseInt(optionsJson.serverPort), optionsJson.serverIP);
}

getApp().catch((error) => {
  logger.error(error);
});
