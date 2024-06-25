/// Transaction builders

import {
  Constr,
  Credential,
  Data,
  Lucid,
  OutRef,
  TxComplete,
  UTxO,
} from "lucid";
import {
  ApyParamsT,
  BankDatum,
  BankDatumT,
  DepositDatum,
  DepositDatumT,
  DepositFixDatum,
  DepositFixDatumT,
} from "../domain_types.ts";
import { ApyCalc } from "./apy_calc.ts";
import { apyParams } from "../../config/apys.ts";

export const VALID_FROM_SUBSTRACT = 1 * 60 * 1000;
export const VALID_TO_ADD = 2 * 60 * 1000;

type ScriptRefs = {
  bankTxHash: string;
  depositTxHash: string;
};

export class TxBuilder {
  // ToDo: refactor
  private bankRefAddrBech32: string = "";
  private bankRefUTxO: UTxO | undefined = undefined;
  private depositRefAddrBech32: string = "";
  private depositRefUTxO: UTxO | undefined = undefined;

  constructor(
    private lucid: Lucid,
    private scriptRefs: ScriptRefs,
    private tokenUnit: string,
    private apyParams: ApyParamsT,
  ) {
    console.log(`tokenUnit: ${tokenUnit}`);
  }

  private async fetchScript(txHash: string): Promise<[UTxO, string]> {
    const outRef: OutRef = {
      txHash,
      outputIndex: 0,
    };
    console.log(`fetchScript. txHash=${txHash}`);
    const [utxo] = await this.lucid.utxosByOutRef([outRef]);
    console.log(`utxo.scriptRef=${utxo.scriptRef}`);
    const validator = utxo.scriptRef;
    if (!validator) {
      throw Error("Could not read validator from ref UTxO");
    }

    const validatorAddressBech32 = this.lucid.utils.validatorToAddress(
      validator,
    );
    return [utxo, validatorAddressBech32];
  }

  private async getBankUtxo(): Promise<UTxO> {
    const cred: Credential = this.lucid.utils.paymentCredentialOf(
      this.bankRefAddrBech32,
    );
    const utxos = await this.lucid.utxosAtWithUnit(cred, this.tokenUnit);
    console.log("getBankUtxo. utxos: ", utxos);
    return utxos[utxos.length - 1]; // take The last one. This could be tweaked.
  }

  async fetchScripts(): Promise<void> {
    console.log("fetchScripts", [
      this.scriptRefs.depositTxHash,
      this.scriptRefs.bankTxHash,
    ]);

    [this.depositRefUTxO, this.depositRefAddrBech32] = await this.fetchScript(
      this.scriptRefs.depositTxHash,
    );
    [this.bankRefUTxO, this.bankRefAddrBech32] = await this.fetchScript(
      this.scriptRefs.bankTxHash,
    );

    console.log("TxBuilder. fetchScripts: ", [
      [this.depositRefUTxO, this.depositRefAddrBech32],
      [this.bankRefUTxO, this.bankRefAddrBech32],
    ]);
  }

  allocate(
    amount: bigint,
    /// Payment Credential Hash
    owner: string,
  ): Promise<TxComplete> {
    const bankDatum = Data.to<BankDatumT>(
      {
        owner,
      },
      BankDatum as unknown as BankDatumT,
    );

    return this.lucid
      .newTx()
      .payToContract(
        this.bankRefAddrBech32,
        { inline: bankDatum },
        {
          [this.tokenUnit]: amount,
        },
      )
      .complete();
  }

  async withdrawByProvider(
    address: string,
    amount: bigint,
  ): Promise<TxComplete> {
    const bankUtxo = await this.getBankUtxo();

    // const owner = this.lucid.utils
    //   .getAddressDetails(address)
    //   .paymentCredential!.hash;

    // const bankDatum = Data.to<BankDatumT>(
    //   {
    //     owner,
    //   },
    //   BankDatum as unknown as BankDatumT,
    // );

    const withdrawByProviderRedeemer = Data.to(new Constr(3, []));

    return this.lucid
      .newTx()
      .readFrom([this.bankRefUTxO!])
      .collectFrom([bankUtxo], withdrawByProviderRedeemer)
      .payToContract(
        this.bankRefAddrBech32,
        { inline: bankUtxo.datum! },
        {
          [this.tokenUnit]: bankUtxo.assets[this.tokenUnit] - amount,
        },
      )
      .payToAddress(address, {
        [this.tokenUnit]: amount,
      })
      .addSigner(address)
      //.attachSpendingValidator(validator)
      .complete();
  }

  async depositFlex(amount: bigint): Promise<TxComplete> {
    const walletAddr = await this.lucid.wallet.address();
    const beneficiar = this.lucid.utils
      .getAddressDetails(walletAddr)
      .paymentCredential!.hash;

    const valid_from = Date.now() - VALID_FROM_SUBSTRACT;
    const valid_to = valid_from + VALID_TO_ADD;
    const deposit_start = valid_to + 1;

    const depositDatum = Data.to<DepositDatumT>(
      {
        beneficiar,
        deposit_start: BigInt(deposit_start),
        fixed: null,
      },
      DepositDatum as unknown as DepositDatumT,
    );

    console.log({
      deposit_start,
      deposit_end: Date.now() - VALID_FROM_SUBSTRACT - 1,
      wait_no_less_than: new Date(deposit_start + VALID_FROM_SUBSTRACT + 1)
        .toLocaleString(),
    });

    return this.lucid
      .newTx()
      .payToContract(
        this.depositRefAddrBech32,
        { inline: depositDatum },
        {
          [this.tokenUnit]: amount,
        },
      )
      .complete();
  }

  async depositFix(
    amount: bigint,
    deposit_end: number,
    start?: number,
  ): Promise<TxComplete> {
    const depositFixRedeemer = Data.to(new Constr(1, []));

    const bankUtxo = await this.getBankUtxo();

    const bankDatum = Data.from<BankDatumT>(
      bankUtxo.datum!,
      BankDatum as unknown as BankDatumT,
    );

    const walletAddr = await this.lucid.wallet.address();
    const beneficiar = this.lucid.utils
      .getAddressDetails(walletAddr)
      .paymentCredential!.hash;

    const deposit_bank_addr = this.lucid.utils.paymentCredentialOf(
      this.bankRefAddrBech32,
    ).hash;

    const deposit_bank_owner = bankDatum.owner;

    const apyCalc = new ApyCalc(this.apyParams);

    const valid_to = start !== undefined
      ? start - 1
      : Date.now() + VALID_TO_ADD;
    const deposit_start = start !== undefined ? start : valid_to + 1;

    const deposit_bank_fraction = apyCalc.calc_fix_interest(
      amount,
      deposit_start,
      deposit_end,
    );

    console.log("depositFix params: ", {
      deposit_start,
      valid_to,
      deposit_end,
      deposit_bank_fraction,
    });

    console.log("slots: ", {
      current_slot: this.lucid.currentSlot(),
      deposit_start: this.lucid.utils.unixTimeToSlot(deposit_start),
      valid_to: this.lucid.utils.unixTimeToSlot(valid_to),
      deposit_end: this.lucid.utils.unixTimeToSlot(deposit_end),
    });

    const depositDatum = Data.to<DepositDatumT>(
      {
        beneficiar,
        deposit_start: BigInt(deposit_start),
        fixed: {
          deposit_bank_addr,
          deposit_bank_owner,
          deposit_end: BigInt(deposit_end),
          deposit_bank_fraction,
        },
      },
      DepositDatum as unknown as DepositDatumT,
    );

    return this.lucid
      .newTx()
      .validTo(valid_to)
      .readFrom([this.bankRefUTxO!])
      .collectFrom([bankUtxo], depositFixRedeemer)
      .payToContract(
        this.bankRefAddrBech32,
        { inline: bankUtxo.datum! },
        {
          [this.tokenUnit]: bankUtxo.assets[this.tokenUnit] -
            deposit_bank_fraction,
        },
      )
      .payToContract(
        this.depositRefAddrBech32,
        { inline: depositDatum },
        {
          [this.tokenUnit]: amount + deposit_bank_fraction,
        },
      )
      .complete();
  }

  async withdrawFix(beneficiar: string, outRef: string): Promise<TxComplete> {
    const [outRefTxHash, outRefTxIdx] =
      (outRef.includes("#") ? outRef : outRef + "#1").split("#");

    const [depositUtxo] = await this.lucid.utxosByOutRef([{
      txHash: outRefTxHash,
      outputIndex: parseInt(outRefTxIdx),
    }]);

    const valid_from = Date.now() - VALID_FROM_SUBSTRACT;

    return this.lucid
      .newTx()
      .validFrom(valid_from)
      .readFrom([this.depositRefUTxO!])
      .collectFrom([depositUtxo], Data.void())
      .addSigner(beneficiar)
      .complete();
  }

  async withdrawFixEarly(
    beneficiar: string,
    outRef: string,
  ): Promise<TxComplete> {
    const [outRefTxHash, outRefTxIdx] =
      (outRef.includes("#") ? outRef : outRef + "#1").split("#");

    const [depositUtxo] = await this.lucid.utxosByOutRef([{
      txHash: outRefTxHash,
      outputIndex: parseInt(outRefTxIdx),
    }]);

    const depositDatum = Data.from<DepositDatumT>(
      depositUtxo.datum!,
      DepositDatum as unknown as DepositDatumT,
    );

    const bankDatum = Data.to<BankDatumT>(
      {
        owner: depositDatum.fixed!.deposit_bank_owner,
      },
      BankDatum as unknown as BankDatumT,
    );

    const valid_from = Date.now() - VALID_FROM_SUBSTRACT;

    return this.lucid
      .newTx()
      .validFrom(valid_from)
      .readFrom([this.depositRefUTxO!])
      .collectFrom([depositUtxo], Data.void())
      .payToContract(
        this.bankRefAddrBech32,
        { inline: bankDatum },
        {
          [this.tokenUnit]: depositDatum.fixed!.deposit_bank_fraction,
        },
      )
      .addSigner(beneficiar)
      .complete();
  }

  async withdrawFlex(beneficiar: string, outRef: string): Promise<TxComplete> {
    const withdrawFlexRedeemer = Data.to(new Constr(2, []));

    // UTxOs
    const [outRefTxHash, outRefTxIdx] =
      (outRef.includes("#") ? outRef : outRef + "#0").split("#");
    const [depositUtxo] = await this.lucid.utxosByOutRef([{
      txHash: outRefTxHash,
      outputIndex: parseInt(outRefTxIdx),
    }]);
    const bankUtxo = await this.getBankUtxo();

    console.log("depositUtxo.datum: ", depositUtxo.datum);

    const depositDatum = Data.from<DepositDatumT>(
      depositUtxo.datum!,
      DepositDatum as unknown as DepositDatumT,
    );

    console.log("depositDatum: ", depositDatum);

    // Validity
    const valid_from = Date.now() - VALID_FROM_SUBSTRACT;
    const deposit_start = Number(depositDatum.deposit_start);
    const deposit_end = valid_from; // lower bound

    // APY Calculation
    const amount = depositUtxo.assets[this.tokenUnit];
    const apyCalc = new ApyCalc(this.apyParams);
    const deposit_bank_fraction = apyCalc.calc_flex_interest(
      amount,
      deposit_start,
      // For some reason, calculations in aiken turn out to be one second less. The reason has not yet been clarified.
      deposit_end - 1000, // "- 1 sec": This is workaround
    );

    console.log({
      amount,
      deposit_start,
      deposit_end,
      duration: deposit_end - deposit_start,
      deposit_bank_fraction,
    });

    return this.lucid
      .newTx()
      .validFrom(valid_from)
      .readFrom([this.bankRefUTxO!])
      .readFrom([this.depositRefUTxO!])
      .collectFrom([bankUtxo], withdrawFlexRedeemer)
      .collectFrom([depositUtxo], Data.void())
      .payToContract(
        this.bankRefAddrBech32,
        { inline: bankUtxo.datum! },
        {
          [this.tokenUnit]: bankUtxo.assets[this.tokenUnit] -
            deposit_bank_fraction,
        },
      )
      .addSigner(beneficiar)
      .complete();
  }
}
