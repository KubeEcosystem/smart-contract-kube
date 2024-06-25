import { AssetClassT } from "../../offchain/domain_types.ts";

export const toUnit = (asset: AssetClassT): string => asset.policy + asset.name;
