import Router from "@koa/router";
import { type Database } from "./database";
import { validateNetworkName } from "./middleware/network_validation";
import { paginationUtils, requireCond, ValidationErrors } from "./utils";

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
    const progress = parseInt(ctx.query.progress as string);
    // add progress field
    const availableNames = ["numTxs", "holders", "createdAt", "progress"];
    const order = {};
    const orderBy = ctx.query.orderBy as string | undefined;
    if (orderBy !== undefined) {
      requireCond(
        availableNames.includes(orderBy),
        `invalid orderBy params: ${orderBy}`,
        ValidationErrors.InvalidFields,
      );
      // check orderType
      const orderType = ctx.query.order as string;
      requireCond(
        ["ASC", "asc", "desc", "DESC"].includes(orderType),
        `invalid order params: ${orderType}`,
        ValidationErrors.InvalidFields,
      );
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

    ctx.body = await db.getTokensInfo(page, perPage, order, {
      key,
      progress,
    });
  });

  return router;
}
