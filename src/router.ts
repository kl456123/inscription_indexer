import Router from "@koa/router";
import { type Database } from "./database";
import { validateNetworkName } from "./middleware/network_validation";
import { paginationUtils } from "./utils";

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
    const tick = ctx.query.tick as string;
    const { page, perPage } = paginationUtils.parsePaginationConfig(ctx);
    const db = databases[ctx.query.network as string];
    const tokensInfo = await db.getTokensInfo(page, perPage, { tick });
    ctx.body = {
      tokensInfo,
    };
  });

  return router;
}
