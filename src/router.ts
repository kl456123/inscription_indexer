import Router from "@koa/router";
import { Database } from "./database";

export function getAllRouters(db: Database) {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server";
  });
  router.get("/tokenBalance", (ctx) => {
    const tick = ctx.query.tick as string;
    const address = ctx.query.address as string;
    ctx.body = {
      address,
      tick,
      balance: db.balances[address][tick],
    };
  });
  router.get("/allTokensBalance", (ctx) => {
    const address = ctx.query.address as string;
    ctx.body = {
      address,
      balance: db.balances[address],
    };
  });
  router.get("/tokenInfo", (ctx) => {
    const tick = ctx.query.tick as string;
    ctx.body = {
      tokenInfo: db.tokens[tick],
    };
  });
  return router;
}
