import { OutRef, TxComplete } from "lucid";
import { buildBankValidator } from "../build/bank.ts";
import { buildDepositValidator } from "../build/deposit.ts";
import { ApyParamsT, AssetClassT } from "../../domain_types.ts";
import { selectWallet } from "../../common/wallet.ts";
import { getScriptRefValidadorPaymentCreds, makeDeployTx } from "./utils.ts";

export async function deployDeposit(
  asset: AssetClassT,
): Promise<TxComplete> {
  console.log("deployDeposit");
  console.log(arguments);
  const lucid = await selectWallet();
  const validator = buildDepositValidator(asset);
  return await makeDeployTx(lucid, validator);
}

export async function deployBank(
  depositOutRef: OutRef,
  apy_params: ApyParamsT,
  asset: AssetClassT,
): Promise<TxComplete> {
  console.log("deployBank");
  console.log(arguments);
  const lucid = await selectWallet();
  const deposit_validator_addr = await getScriptRefValidadorPaymentCreds(
    lucid,
    depositOutRef,
  );
  const validator = buildBankValidator(
    deposit_validator_addr,
    apy_params,
    asset,
  );

  return await makeDeployTx(lucid, validator);
}
