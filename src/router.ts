import Router from "@koa/router";

export function getAllRouters() {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.body = "inscription server";
  });
  return router;
}
