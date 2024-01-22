import { type Context, type Next } from "koa";

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status ?? 500;
    ctx.body = { msg: err.message, code: ctx.status };
  }
}
