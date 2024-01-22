import Router from "@koa/router";
import { type Database } from "./database";
import { validateNetworkName } from "./middleware/network_validation";
import { logger } from "./logger";
import { TokenBalanceEntity } from "./entities";
import { paginationUtils } from "./utils";

export function getAllRouters(databases: Record<string, Database>): Router {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server for most evm chain";
  });

  router.get("/tokenBalance", async (ctx) => {
    logger.info(ctx.query);
    const tick = ctx.query.tick as string;
    const address = ctx.query.address as string;
    validateNetworkName(ctx.query.network, databases);
    const db = databases[ctx.query.network as string];
    const balance = await db.getTokenBalance(tick, address);
    ctx.body = {
      address,
      tick,
      balance,
    };
  });

  router.get("/supportedNetworks", async (ctx) => {
    logger.info(ctx.query);
    const networks = Object.keys(databases);
    ctx.body = {
      networks,
    };
  });

  router.get("/allTokensBalance", async (ctx) => {
    logger.info(ctx.query);
    const address = ctx.query.address as string;
    validateNetworkName(ctx.query.network, databases);
    const db = databases[ctx.query.network as string];
    const balances = await db.connection.manager.find(TokenBalanceEntity, {
      where: { address },
    });
    ctx.body = {
      address,
      balances,
    };
  });

  router.get("/allTokensInfo", async (ctx) => {
    logger.info(ctx.query);
    validateNetworkName(ctx.query.network, databases);
    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.network as string];
    const tokensInfo = await db.getAllTokensInfo(page, perPage);
    ctx.body = {
      tokensInfo,
    };
  });

  router.get("/tokenInfo", async (ctx) => {
    logger.info(ctx.query);
    const tick = ctx.query.tick as string;
    validateNetworkName(ctx.query.network, databases);
    const db = databases[ctx.query.network as string];
    const tokenInfo = await db.getTokenInfo(tick);
    ctx.body = {
      tokenInfo,
    };
  });
  return router;
}
