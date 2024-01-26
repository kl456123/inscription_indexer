import { type Database } from "../database";
import { requireCond, ValidationErrors } from "../utils";

export function validateChainId(
  chainId: string | string[] | undefined,
  dbs: Record<string, Database>,
): void {
  requireCond(
    chainId !== undefined,
    "no chainId params!",
    ValidationErrors.InvalidFields,
  );
  requireCond(
    typeof chainId === "string",
    `invalid chainId params: ${chainId!.toString()}`,
    ValidationErrors.InvalidFields,
  );
  chainId = chainId as string;
  requireCond(
    dbs[chainId] !== undefined,
    `unknown chainId name: ${chainId}`,
    ValidationErrors.InvalidFields,
  );
}
