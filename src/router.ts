import Router from "@koa/router";
import { type Database } from "./database";
import { validateChainId } from "./middleware/network_validation";
import { paginationUtils, parseOrderInfo, parseProgressInfo } from "./utils";
import { dbNames } from "./constants";

export function getAllRouters(databases: Record<string, Database>): Router {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server for most evm chain";
  });

  router.get("/supportedNetworks", async (ctx) => {
    const chainIds = Object.keys(databases);
    const networks = chainIds.map((chainId) => {
      return {
        chainId,
        // TODO(add icon info)
        icon: "",
        network: dbNames[chainId],
      };
    });
    ctx.body = {
      networks,
    };
  });

  router.get("/holdersInfo", async (ctx) => {
    validateChainId(ctx.query.chainId, databases);
    const address = ctx.query.address as string;
    const tick = ctx.query.tick as string;
    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[parseInt(ctx.query.chainId as string)];
    const availableNames = ["amount", "tick"];
    const order = parseOrderInfo(ctx, availableNames);
    ctx.body = await db.getHoldersInfo(page, perPage, order, {
      address,
      tick,
    });
  });

  router.get("/tokensInfo", async (ctx) => {
    validateChainId(ctx.query.chainId, databases);
    const keyword = ctx.query.keyword as string | undefined;
    const progress = parseProgressInfo(ctx);

    const availableNames = ["numTxs", "holders", "createdAt", "progress"];
    const order = parseOrderInfo(ctx, availableNames);

    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.chainId as string];

    ctx.body = await db.getTokensInfo(page, perPage, order, {
      keyword,
      progress,
    });
  });

  return router;
}
