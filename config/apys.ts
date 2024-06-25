import { ApyParamsT } from "../offchain/domain_types.ts";
import { secsIn } from "./common/time.ts";

const perSecond = 365n * 24n * 60n * 60n;

export const apyParams = {
  main: {
    fix_tiers: [
      {
        max_duration_secs: BigInt(6 * secsIn.month),
        apy: 1050n,
      },
      {
        max_duration_secs: BigInt(12 * secsIn.month),
        apy: 1350n,
      },
    ],
    flex_apy: 777n,
  },
  preprod: {
    fix_tiers: [
        {
            max_duration_secs: BigInt(6 * secsIn.min),
            apy: 777n,
        },
        {
            max_duration_secs: BigInt(12 * secsIn.min),
            apy: 1050n,
        },
    ],
    flex_apy: 350n,
  },
  test1: {
    fix_tiers: [
        {
            max_duration_secs: BigInt(6 * secsIn.min),
            apy: 1050n,
        },
        {
            max_duration_secs: BigInt(12 * secsIn.min),
            apy: 1350n,
        },
    ],
    flex_apy: 10n * perSecond,
  },
  test2: {
    fix_tiers: [
      {
        max_duration_secs: BigInt(5),
        apy: 10n * perSecond,
      },
      {
        max_duration_secs: BigInt(10),
        apy: 20n * perSecond,
      },
      {
        max_duration_secs: BigInt(15),
        apy: 30n * perSecond,
      },
    ],
    flex_apy: 10n * perSecond,
  },
} as const satisfies Record<string, ApyParamsT>;

export type ApyPlan = keyof typeof apyParams;
