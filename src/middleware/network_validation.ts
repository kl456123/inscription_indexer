import { requireCond, ValidationErrors } from "../utils";

export function validateChainIds(
  chainIds: string | string[] | undefined,
  validChainIds: number[],
): number[] {
  if (chainIds === undefined) {
    // fetch from all chains
    return validChainIds;
  } else {
    if (typeof chainIds === "string") {
      chainIds = [chainIds];
    } else {
      chainIds = chainIds as string[];
    }

    const res = chainIds.map((chainId) => parseInt(chainId));
    for (const chainId of res) {
      requireCond(
        validChainIds.includes(chainId),
        `unknown chainId name: ${chainId}`,
        ValidationErrors.InvalidFields,
      );
    }
    return res;
  }
}
