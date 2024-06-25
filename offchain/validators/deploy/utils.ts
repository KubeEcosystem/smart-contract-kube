import { Data, Lucid, OutRef, Script, TxComplete } from "lucid";
import { getAlwaysFailAddrBech32 } from "../../common/blueprints.ts";

export function makeDeployTx(
  lucid: Lucid,
  validator: Script,
): Promise<TxComplete> {
  const alwaysFailAddressBech32 = getAlwaysFailAddrBech32(lucid);
  return lucid
    .newTx()
    .payToContract(
      alwaysFailAddressBech32,
      { inline: Data.void(), scriptRef: validator },
      { lovelace: 2_000_000n },
    )
    .complete();
}

/// Returns payment credential of validator, sitting at OTxO, specified by OutRef
export async function getScriptRefValidadorPaymentCreds(
  lucid: Lucid,
  outRef: OutRef,
): Promise<string> {
  const [utxo] = await lucid.utxosByOutRef([outRef]);

  const validator = utxo.scriptRef;
  if (!validator) {
    throw Error("Could not read validator from ref UTxO");
  }

  const validatorAddressBech32 = lucid.utils.validatorToAddress(validator);
  const scriptAddress =
    lucid.utils.paymentCredentialOf(validatorAddressBech32).hash;
  return scriptAddress;
}
