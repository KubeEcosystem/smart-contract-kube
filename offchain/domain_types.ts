import { Data } from "lucid";

export const AssetClass = Data.Object({
  policy: Data.Bytes({ maxLength: 28 }),
  name: Data.Bytes(),
});
export type AssetClassT = Data.Static<typeof AssetClass>;

const ApyTier = Data.Object({
  max_duration_secs: Data.Integer(),
  apy: Data.Integer(),
});
type ApyTierT = Data.Static<typeof ApyTier>;

export const ApyParams = Data.Object({
  fix_tiers: Data.Array(ApyTier),
  flex_apy: Data.Integer(),
});
export type ApyParamsT = Data.Static<typeof ApyParams>;

// Datums:

export const BankDatum = Data.Object({
  owner: Data.Bytes(),
});

export type BankDatumT = Data.Static<typeof BankDatum>;

export const DepositFixDatum = Data.Object({
  deposit_bank_addr: Data.Bytes(),
  deposit_bank_owner: Data.Bytes(),
  deposit_end: Data.Integer(),
  deposit_bank_fraction: Data.Integer(),
});
export type DepositFixDatumT = Data.Static<typeof DepositFixDatum>;

export const DepositDatum = Data.Object({
  beneficiar: Data.Bytes(),
  deposit_start: Data.Integer(),
  /// Required for Fixed deposits, for Flexible should be None
  fixed: Data.Nullable(DepositFixDatum),
});
export type DepositDatumT = Data.Static<typeof DepositDatum>;
