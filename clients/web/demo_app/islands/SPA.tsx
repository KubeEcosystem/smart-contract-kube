import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { useEffect, useState } from "preact/hooks";
import { Blockfrost, Lucid, TxComplete } from "lucid";
import { createTxBuilder } from "../../../../config/create_tx_builder.ts";
import { TxBuilder, VALID_TO_ADD } from "../../../../offchain/tx/mod.ts";

const createLucid = async (blockFrostId: string) => {
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      blockFrostId,
    ),
    "Preprod",
  );
  return lucid;
};

let lucid: Lucid;
let txBuilder: TxBuilder;

export default function SPA() {
  const [blockFrostId, setBlockFrostId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawOutRef, setWithdrawOutRef] = useState<string>("");
  const [owner, setOwner] = useState<string>();
  const [depositDuration, setDepositDuration] = useState<string>("4");

  const onCreateLucid = async () => {
    console.log("blockFrostId", blockFrostId);

    lucid = await createLucid(blockFrostId);
    (window as any).lucid = lucid;

    console.log("lucid.network: ", lucid.network);

    const wallet = await window.cardano
      .eternl
      .enable();

    lucid.selectWallet(wallet);

    const publicKeyHash = lucid.utils
      .getAddressDetails(await lucid.wallet.address())
      .paymentCredential
      ?.hash;
    setOwner(publicKeyHash);
    console.log(`publicKeyHash for owner: ${publicKeyHash}`);

    txBuilder = createTxBuilder(lucid, "preprod", ".json:-1");

    await txBuilder.fetchScripts();

    // const utxos = await lucid.utxosAt(
    //   "addr_test1qrkcjnexwn4pvkjejrs98kqe94pqkhg8uyjvcu24zt9d08sz7gztaw2kl2pnafw0e32nxwyy8vptxe04yuecax02lj5q6vzv8q",
    // );
    // console.log(utxos);
  };

  const signAndComplete = async (tx: TxComplete) => {
    console.log("signAndComplete");
    const txSigned = await tx.sign().complete();
    console.log("signed");
    const txHash = await txSigned.submit();
    console.log(`txHash: ${txHash}`);
    const success = await lucid!.awaitTx(txHash);
    console.log(`success: ${success}`);
  };

  const onAllocate = async () => {
    console.log("onAllocate. lucid.network: ", lucid.network);
    console.log(`onAllocate. publicKeyHash for owner: ${owner}`);
    const tx = await txBuilder.allocate(10_000n, owner!);
    await signAndComplete(tx);
  };

  const onWithdrawByProvider = async () => {
    const tx = await txBuilder.withdrawByProvider(
      await lucid.wallet.address(),
      30n,
    );
    await signAndComplete(tx);
  };

  const onDepositFlex = async () => {
    const tx = await txBuilder.depositFlex(BigInt(depositAmount));
    await signAndComplete(tx);
  };

  const onDepositFix = async () => {
    const duration = parseInt(depositDuration || "4");
    const valid_to = Date.now() + VALID_TO_ADD;
    const deposit_start = valid_to + 1;
    const deposit_end = deposit_start + duration * 1000;

    const tx = await txBuilder.depositFix(
      BigInt(depositAmount),
      deposit_end,
      deposit_start,
    );
    await signAndComplete(tx);
  };

  const onWithdrawFlex = async () => {
    const tx = await txBuilder.withdrawFlex(
      await lucid.wallet.address(),
      withdrawOutRef,
    );
    await signAndComplete(tx);
  };

  const onWithdrawFix = async () => {
    const tx = await txBuilder.withdrawFix(
      await lucid.wallet.address(),
      withdrawOutRef,
    );
    await signAndComplete(tx);
  };

  const onWithdrawFixEarly = async () => {
    const tx = await txBuilder.withdrawFixEarly(
      await lucid.wallet.address(),
      withdrawOutRef,
    );
    await signAndComplete(tx);
  };

  return (
    <div>
      <label for="blockFrostId">blockFrostId:</label>
      <input
        id="blockFrostId"
        type="text"
        value={blockFrostId}
        onInput={(e) => setBlockFrostId(e.currentTarget.value)}
      />
      <div>
        <button className="flex flex-col" onClick={onCreateLucid}>
          Create Lucid
        </button>
        <div>
          Provider features:
          <button className="flex flex-col" onClick={onAllocate}>
            Allocate
          </button>
          <button className="flex flex-col" onClick={onWithdrawByProvider}>
            Withdraw by Provider
          </button>
        </div>
        <div>
          Staker features:
          <div>
            <label for="depositAmount">depositAmount:</label>
            <input
              id="depositAmount"
              type="text"
              value={depositAmount}
              onInput={(e) => setDepositAmount(e.currentTarget.value)}
            />
            <label for="depositDuration">depositDuration, sec:</label>
            <input
              id="depositDuration"
              type="text"
              value={depositDuration}
              onInput={(e) => setDepositDuration(e.currentTarget.value)}
            />
            <button onClick={onDepositFlex}>
              Deposit Flex
            </button>
            <button onClick={onDepositFix}>
              Deposit Fix
            </button>
          </div>
          <div>
            <label for="withdrawOutRef">withdrawOutRef:</label>
            <input
              id="withdrawOutRef"
              type="text"
              value={withdrawOutRef}
              onInput={(e) => setWithdrawOutRef(e.currentTarget.value)}
            />
            <button onClick={onWithdrawFlex}>
              Withdraw Flex
            </button>
            <button onClick={onWithdrawFix}>
              Withdraw Fix
            </button>
            <button onClick={onWithdrawFixEarly}>
              Withdraw Fix Early
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
