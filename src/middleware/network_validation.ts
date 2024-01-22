import { type Database } from "../database";
import { requireCond, ValidationErrors } from "../utils";

export function validateNetworkName(
  network: string | string[] | undefined,
  dbs: Record<string, Database>,
): void {
  requireCond(
    network !== undefined,
    "no network params!",
    ValidationErrors.InvalidFields,
  );
  requireCond(
    typeof network === "string",
    `invalid network params: ${network!.toString()}`,
    ValidationErrors.InvalidFields,
  );
  network = network as string;
  requireCond(
    dbs[network] !== null,
    `unknown network name: ${network}`,
    ValidationErrors.InvalidFields,
  );
}
