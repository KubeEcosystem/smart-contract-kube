import { Lucid, OutRef, TxComplete } from "lucid";
import { Contract, ExecutionParams, getExecutionParams } from "./args.ts";
import {
  deployBank,
  deployDeposit,
} from "../../offchain/validators/deploy/mod.ts";
import { selectWallet } from "../../offchain/common/wallet.ts";
import { ApyParamsT, AssetClassT } from "../../offchain/domain_types.ts";
import { RetryHandler, sleep } from "../../libs/retry_handler.ts";
import { DeploymentParams } from "../../config/deployments.ts";
import { toUnit } from "../../offchain/common/assets.ts";

const SLEEP_MS = 3000;

type DeployedTxs = {
  depositTxHash?: string;
  bankTxHash?: string;
};

class Deploy {
  constructor(
    private lucid: Lucid,
    private execParams: ExecutionParams,
  ) {}

  result: DeployedTxs = {};

  private createRetryHandler() {
    return new RetryHandler({
      maxAttempts: 10,
      delayMs: 3000,
      errorMessageSubstring: "ValueNotConservedUTxO",
    });
  }

  private async signAndSubmit(tx: TxComplete): Promise<string> {
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    const success = await this.lucid.awaitTx(txHash);
    console.log(`success? ${success}`);
    return txHash;
  }

  private getResult(): DeploymentParams {
    return {
      network: this.execParams.network,
      date: new Date().toISOString(),
      apyParams: this.execParams.apyParams,
      asset: toUnit(this.execParams.asset),
      depositRef: this.result.depositTxHash!,
      bankRef: this.result.bankTxHash!,
    };
  }

  shouldDeploy(what: Exclude<Contract, "all">): boolean {
    return this.execParams.contract === "all" ||
      what === this.execParams.contract;
  }

  async deployDeposit(): Promise<void> {
    const tx = await deployDeposit(this.execParams.asset);
    const txHash = await this.signAndSubmit(tx);
    if (!this.execParams.depositRefTx) {
      this.execParams.depositRefTx = txHash;
    }
    this.result.depositTxHash = txHash;
    console.log(`deposit txHash: ${txHash}. awaiting...`);
  }

  async deployBank(): Promise<void> {
    const depositOutRef: OutRef = {
      txHash: this.execParams.depositRefTx!,
      outputIndex: 0,
    };

    const retry = this.createRetryHandler();

    const txHash = await retry.try(async () => {
      const tx = await deployBank(
        depositOutRef,
        this.execParams.apyParams,
        this.execParams.asset,
      );
      return this.signAndSubmit(tx);
    });

    this.result.bankTxHash = txHash;
    console.log(`bank txHash: ${txHash}`);
  }

  async deploy(): Promise<void> {
    if (this.shouldDeploy("deposit")) {
      await this.deployDeposit();
    }

    if (this.shouldDeploy("bank")) {
      if (this.shouldDeploy("deposit")) {
        await sleep(SLEEP_MS);
      }
      await this.deployBank();
    }
  }

  saveConfig() {
    const path = "../../config/deployments.json";
    const jsonStr = Deno.readTextFileSync(path);
    const json = JSON.parse(jsonStr);
    const deployments = json[this.execParams.network] as DeploymentParams[];
    const result = this.getResult();
    if (deployments.length == 0) {
      deployments.push(result);
    } else {
      deployments[deployments.length - 1] = result;
    }

    Deno.writeTextFileSync(
      path,
      JSON.stringify(
        json,
        (_, value) => typeof value === "bigint" ? value.toString() : value,
        2,
      ),
    );
  }
}

// ============================================================================
// == Entry point

const execParams = getExecutionParams();
const lucid = await selectWallet();
const deploy = new Deploy(
  lucid,
  execParams,
);

await deploy.deploy();
deploy.saveConfig();

console.log("result: ", deploy.result);
