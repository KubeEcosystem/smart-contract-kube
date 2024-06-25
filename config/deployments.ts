import { assets } from "./assets.ts";
import { Network } from "./common/types.ts";
import { toUnit } from "../offchain/common/assets.ts";
import { ApyParamsT } from "../offchain/domain_types.ts";
import { apyParams } from "./apys.ts";

export type DeploymentParams = {
  apyParams: ApyParamsT;
  asset: string;
  depositRef: string;
  bankRef: string;
  // Optional parameters:
  network?: Network;
  name?: string;
  description?: string;
  date?: string; // ISO format
};

export type DeploymentsJson = Record<Network, DeploymentParams[]>;

type DeploymentsRecord = Record<string, DeploymentParams>;
type Deployments = Partial<Record<Network, DeploymentsRecord>>;

export const deployments: Deployments = {
  preview: {
    preview1: {
      apyParams: apyParams.test1,
      asset: toUnit(assets.preview.preview1),
      depositRef:
        "7a76ecf8b96c5e2c99d48b45be724c0cca5f14f9b973bc4f05da4e9113c395dd",
      bankRef:
        "dd8ae445fb38d60ce2885562a19999dec1049f07fe0fe279c254aa97df423019",
    },
  },
  preprod: {
    preprod1: {
      apyParams: apyParams.preprod,
      asset: toUnit(assets.preprod.preprod1),
      depositRef:
        "5396a454f52e5247d29e093b1a7414541a1644ac7117c1931f9127a1217858f8",
      bankRef:
        "1f83ee064ed68a26e6871573640e884cad0149777d27160d9a20a6302d6aa8d0",
    },
  },
};
