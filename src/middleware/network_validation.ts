import { type Context, type Next } from "koa";
import { type Database } from "../database";

export function validateNetworkName(
  network: string | string[] | undefined,
  dbs: Record<string, Database>,
): void {
  if (network === undefined) {
    throw new Error("no network params!");
  }
  if (typeof network !== "string") {
    throw new Error(`invalid network params: ${network.toString()}`);
  }
  if (dbs[network] === undefined) {
    throw new Error(`unknown network name: ${network}`);
  }
}

export async function validateCommonFields(
  ctx: Context,
  next: Next,
): Promise<void> {
  // validateNetworkName(ctx.query.network, databases);
}
