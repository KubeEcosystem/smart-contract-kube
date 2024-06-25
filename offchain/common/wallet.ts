import { Blockfrost, Lucid, Network, TxComplete } from "lucid";

function checkEnvVars<T extends string>(
  variableNames: readonly T[],
): Record<T, string> {
  const result: Record<T, string> = {} as Record<T, string>;
  const missingVars: string[] = [];
  for (const envVar of variableNames) {
    const value = Deno.env.get(envVar);
    // console.log(`"${envVar}" = "${value}" (undefined? ${value === undefined})`);
    if (!value) {
      missingVars.push(envVar);
    } else {
      result[envVar] = value;
    }
  }
  // console.log("missingVars: ", missingVars);
  if (missingVars.length > 0) {
    throw new Error(
      `The following environment variables are required: ${
        missingVars.join(", ")
      }`,
    );
  }
  return result;
}

export async function createLucid() {
  const envVarNames = [
    "BLOCKFROST_URL",
    "LICID_NETWORK",
    "BLOCKFROST_PROJECT_ID",
  ] as const;
  const env = checkEnvVars(envVarNames);
  const lucid = await Lucid.new(
    new Blockfrost(
      env.BLOCKFROST_URL,
      env.BLOCKFROST_PROJECT_ID,
    ),
    env.LICID_NETWORK as Network,
  );
  return lucid;
}

export async function selectWallet(): Promise<Lucid> {
  const lucid = await createLucid();
  const env = checkEnvVars(["WALLET_SEED"]);
  lucid.selectWalletFromSeed(env.WALLET_SEED);
  return lucid;
}

export async function signAndSubmit(
  lucid: Lucid,
  tx: TxComplete,
): Promise<string> {
  console.log(`tx.toHash(): ${tx.toHash()}`);
  const txSigned = await tx.sign().complete();
  console.log("signed");
  const txHash = await txSigned.submit();
  console.log(`txHash: ${txHash}`);
  const success = await lucid.awaitTx(txHash);
  console.log(`success: ${success}`);
  return txHash;
}
