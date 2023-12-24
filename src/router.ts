import Router from "@koa/router";
import { type Database } from "./database";
import { TokenBalanceEntity } from "./entities";

export function getAllRouters(db: Database): Router {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server";
  });
  router.get("/tokenBalance", async (ctx) => {
    const tick = ctx.query.tick as string;
    const address = ctx.query.address as string;
    const balance = await db.getTokenBalance(tick, address);
    ctx.body = {
      address,
      tick,
      balance,
    };
  });
  router.get("/allTokensBalance", async (ctx) => {
    const address = ctx.query.address as string;
    const balances = await db.connection.manager.find(TokenBalanceEntity, {
      where: { address },
    });
    ctx.body = {
      address,
      balances,
    };
  });
  router.get("/tokenInfo", async (ctx) => {
    const tick = ctx.query.tick as string;
    const tokenInfo = await db.getTokenInfo(tick);
    ctx.body = {
      tokenInfo,
    };
  });
  return router;
}
