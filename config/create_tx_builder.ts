import { Lucid } from "lucid";
import { Network } from "./common/types.ts";
import { TxBuilder } from "../offchain/tx/mod.ts";
import {
  DeploymentParams,
  deployments,
  DeploymentsJson,
} from "./deployments.ts";
import json from "./deployments.json" with { type: "json" };

const deploymentsJson: DeploymentsJson = json as unknown as DeploymentsJson;

function loadDeploymentFromJson(
  network: Network,
  query: string,
): DeploymentParams {
  if (query === "-1") {
    const list = deploymentsJson[network];
    return list[list.length - 1];
  }
  throw new Error(`loadDeploymentFromJson: Unknown query: "${query}"`);
}

function getDeploymentParams(
  network: Network,
  deploymentName: string,
): DeploymentParams {
  const prefix = ".json:";
  if (deploymentName.startsWith(prefix)) {
    return loadDeploymentFromJson(
      network,
      deploymentName.substring(prefix.length),
    );
  } else {
    const deploymentsInNetwork = deployments[network];
    if (!deploymentsInNetwork) {
      throw new Error(
        `There is no deployments configurations defined for network ${network}`,
      );
    }
    const deployment: DeploymentParams = deploymentsInNetwork[deploymentName];
    if (!deployment) {
      throw new Error(`There is no deployment "${deploymentName}"`);
    }
    return deployment;
  }
}

export function createTxBuilder(
  lucid: Lucid,
  network: Network,
  deploymentName: string,
): TxBuilder {
  const deployment = getDeploymentParams(network, deploymentName);
  return new TxBuilder(
    lucid,
    {
      depositTxHash: deployment.depositRef,
      bankTxHash: deployment.bankRef,
    },
    deployment.asset,
    deployment.apyParams,
  );
}
