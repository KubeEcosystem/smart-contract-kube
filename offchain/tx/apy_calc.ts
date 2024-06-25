import { ApyParamsT } from "../domain_types.ts";

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export class ApyCalc {
  constructor(public params: ApyParamsT) {}

  private calculate(amount: bigint, seconds: bigint, apy: bigint): bigint {
    return amount * BigInt(apy) * BigInt(seconds) /
      (100n * 100n * 365n * 24n * 60n * 60n);
  }

  private get_deposit_period_in_seconds(start: number, end: number): bigint {
    const last_tier = this.params.fix_tiers[this.params.fix_tiers.length - 1];
    const secs = Math.floor((end - start) / 1000);
    return secs < 0 ? 0n : min(last_tier.max_duration_secs, BigInt(secs));
  }

  private get_fix_deposit_apy(secs: bigint): bigint {
    const tier_maybe = this.params.fix_tiers.find((i) =>
      secs <= i.max_duration_secs
    );

    const tier = tier_maybe === undefined
      ? this.params.fix_tiers[this.params.fix_tiers.length - 1]
      : tier_maybe;

    return tier.apy;
  }

  calc_fix_interest(amount: bigint, start: number, end: number) {
    const secs = this.get_deposit_period_in_seconds(start, end);
    const apy = this.get_fix_deposit_apy(secs);
    const result = this.calculate(amount, secs, apy);

    console.log("calc_fix_interest", {
      amount,
      secs,
      apy,
      result,
    });
    return result;
  }

  calc_flex_interest(amount: bigint, start: number, end: number) {
    const seconds = Math.floor((end - start) / 1000);
    const secs = seconds < 0 ? 0 : seconds;

    const result = this.calculate(amount, BigInt(secs), this.params.flex_apy);
    console.log("calc_flex_interest", {
      amount,
      secs,
      apy: this.params.flex_apy,
      result,
    });
    return result;
  }
}
