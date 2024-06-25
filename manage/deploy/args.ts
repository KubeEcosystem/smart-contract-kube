import { apyParams, ApyPlan } from "../../config/apys.ts";
import { assets } from "../../config/assets.ts";
import { Network } from "../../config/common/types.ts";
import { ApyParamsT, AssetClassT } from "../../offchain/domain_types.ts";
import { ErrCollector } from "../../libs/errors_collector/mod.ts";

export type Contract = "all" | "deposit" | "bank";

type Args = {
  contract: Contract;
  depositRefTx?: string;
};

type CliArgs = {
  network: Network;
  apyPlan: ApyPlan;
  asset: string;
} & Args;

export type ExecutionParams = {
  network: Network;
  apyParams: ApyParamsT;
  asset: AssetClassT;
} & Args;

function getCliArgs(): CliArgs {
  const err = new ErrCollector();
  const network = Deno.args[0] as Network;
  const apyPlan = Deno.args[1] as ApyPlan;
  const asset = Deno.args[2] as string;
  const contract = (Deno.args[3] || "all") as Contract;
  const depositRefTx = Deno.args[4];

  err.assert(
    contract === "bank" && !depositRefTx,
    "In order to deploy Bank contract, you need to specify depositRefTx.",
  );
  err.validate();

  return {
    network,
    apyPlan,
    asset,
    contract,
    depositRefTx,
  };
}

export function getExecutionParams(): ExecutionParams {
  const args = getCliArgs();
  const err = new ErrCollector();
  const apyPlan = apyParams[args.apyPlan] as unknown as ApyParamsT;
  err.assert(!apyPlan, `There is no APY Plan with name: ${args.apyPlan}`);

  // deno-lint-ignore no-explicit-any
  const asset = (assets[args.network] as any || {})[args.asset];
  err.assert(
    !asset,
    `There is no Asset ${args.asset} for network ${args.network}`,
  );

  err.validate();
  return {
    network: args.network,
    apyParams: apyPlan,
    asset,
    contract: args.contract,
    depositRefTx: args.depositRefTx,
  };
}
