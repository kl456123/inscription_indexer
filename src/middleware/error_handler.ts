import { type Context, type Next } from "koa";
import { logger } from "../logger";

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status ?? 500;
    const error = { msg: err.message, code: err.code, data: err.data };
    ctx.body = error;
    logger.error("failed: ", ctx.path, "error:", JSON.stringify(error));
  }
}
