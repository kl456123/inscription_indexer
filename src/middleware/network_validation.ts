import { type Database } from "../database";
import { requireCond } from "../utils";

export function validateNetworkName(
  network: string | string[] | undefined,
  dbs: Record<string, Database>,
): void {
  requireCond(network !== undefined, "no network params!");
  requireCond(
    typeof network !== "string",
    `invalid network params: ${network!.toString()}`,
  );
  network = network as string;
  requireCond(dbs[network] !== null, `unknown network name: ${network}`);
}
