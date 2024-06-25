import { Lucid } from "lucid";
import { createTxBuilder } from "../../config/create_tx_builder.ts";
import { selectWallet } from "../../offchain/common/wallet.ts";
import { TxBuilder } from "../../offchain/tx/mod.ts";

export async function init(): Promise<[Lucid, TxBuilder]> {
  const lucid = await selectWallet();
  const txBuilder = createTxBuilder(lucid, "preview", ".json:-1");
  await txBuilder.fetchScripts();
  return [lucid, txBuilder];
}
