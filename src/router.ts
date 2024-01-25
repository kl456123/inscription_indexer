import Router from "@koa/router";
import { type Database } from "./database";
import { validateNetworkName } from "./middleware/network_validation";
import { paginationUtils, parseOrderInfo } from "./utils";

export function getAllRouters(databases: Record<string, Database>): Router {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server for most evm chain";
  });

  router.get("/supportedNetworks", async (ctx) => {
    const networks = Object.keys(databases);
    ctx.body = {
      networks,
    };
  });

  router.get("/holdersInfo", async (ctx) => {
    validateNetworkName(ctx.query.network, databases);
    const address = ctx.query.address as string;
    const tick = ctx.query.tick as string;
    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.network as string];
    const availableNames = ["amount", "tick"];
    const order = parseOrderInfo(ctx, availableNames);
    ctx.body = await db.getHoldersInfo(page, perPage, order, {
      address,
      tick,
    });
  });

  router.get("/tokensInfo", async (ctx) => {
    validateNetworkName(ctx.query.network, databases);
    const keyword = ctx.query.keyword as string | undefined;
    const progress = parseInt(ctx.query.progress as string);

    const availableNames = ["numTxs", "holders", "createdAt", "progress"];
    const order = parseOrderInfo(ctx, availableNames);

    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.network as string];

    ctx.body = await db.getTokensInfo(page, perPage, order, {
      keyword,
      progress,
    });
  });

  return router;
}
