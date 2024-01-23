import Router from "@koa/router";
import { type Database } from "./database";
import { validateNetworkName } from "./middleware/network_validation";
import { paginationUtils, requireCond, ValidationErrors } from "./utils";
import { Progress } from "./types";

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
    const holders = await db.getHoldersInfo(page, perPage, { tick, address });
    ctx.body = {
      holders,
    };
  });

  router.get("/tokensInfo", async (ctx) => {
    validateNetworkName(ctx.query.network, databases);
    const key = ctx.query.key as string;
    const progress = parseInt(ctx.query.key as string);
    // add progress field
    const availableNames = ["numTxs", "holders", "createdAt"];
    const order = {};
    const orderBy = ctx.query.orderBy as string | undefined;
    if (orderBy !== undefined) {
      requireCond(
        availableNames.includes(orderBy),
        `invalid orderBy params: ${orderBy}`,
        ValidationErrors.InvalidFields,
      );
      const orderType = ctx.query.order;
      requireCond(
        orderType !== undefined,
        `invalid orderType`,
        ValidationErrors.InvalidFields,
      );
      order[orderBy] = orderType;
    }
    const keyNames = Object.keys(order);
    if (keyNames.length > 1) {
      throw new Error(`invalid order info`);
    }

    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.network as string];

    const tokensInfo = await db.getTokensInfo(page, perPage, order, {
      key,
      progress,
    });
    const total = await db.getTokenCounts();
    ctx.body = {
      tokensInfo,
      total,
      page,
    };
  });

  return router;
}
