import { fromText } from "lucid";
import { AssetClassT } from "../offchain/domain_types.ts";
import { Network } from "./common/types.ts";

type Assets = Record<string, AssetClassT>;

export const assets = {
  mainnet: {
    prod: {
      policy: "a26022096c6a8052987dabbfa94849ab7886cf0bb7840044e017d5be",
      name: fromText("KubeCoin"),
    },
  },
  preprod: {
    preprod1: {
      policy: "6c58d80cbd21c426bec657f5728b55602fbeeb18dc78dfea050f90b2",
      name: fromText("KUKECOIN"),
    },
  },
  preview: {
    preview1: {
      policy: "1afba0694f95a270767427a4ca1a8d1fe324853796ef96c07e87424f",
      name: fromText("demo1"),
    },
  },
} as const satisfies Partial<Record<Network, Assets>>;
