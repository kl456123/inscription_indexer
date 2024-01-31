import Router from "@koa/router";
import { type Database } from "./database";
import { validateChainIds } from "./middleware/network_validation";
import { paginationUtils, parseOrderInfo, parseProgressInfo } from "./utils";
import { dbNames } from "./constants";

export function getAllRouters(dependencies: {
  database: Database;
  chainIds: number[];
}): Router {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server for most evm chain";
  });

  router.get("/supportedNetworks", async (ctx) => {
    const networks = dependencies.chainIds.map((chainId) => {
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
    const chainIds = validateChainIds(ctx.query.chainId, dependencies.chainIds);
    const address = ctx.query.address as string;
    const tick = ctx.query.tick as string;
    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const availableNames = ["amount", "tick"];
    const order = parseOrderInfo(ctx, availableNames);
    ctx.body = await dependencies.database.getHoldersInfo(
      page,
      perPage,
      order,
      {
        chainIds,
        address,
        tick,
      },
    );
  });

  router.get("/tokensInfo", async (ctx) => {
    const chainIds = validateChainIds(ctx.query.chainId, dependencies.chainIds);
    const keyword = ctx.query.keyword as string | undefined;
    const progress = parseProgressInfo(ctx);

    const availableNames = ["numTxs", "holders", "createdAt", "progress"];
    const order = parseOrderInfo(ctx, availableNames);

    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    ctx.body = await dependencies.database.getTokensInfo(page, perPage, order, {
      chainIds,
      keyword,
      progress,
    });
  });

  return router;
}
