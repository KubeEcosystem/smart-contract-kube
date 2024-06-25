import { fromHex, Lucid, SpendingValidator, toHex } from "lucid";
import * as cbor from "cbor";

import plutusBlueprint from "../../onchain/plutus.json" with {
  type: "json",
};

export function getPlutusBlueprint(title: string) {
  const validator = plutusBlueprint.validators.find((v) => v.title === title);
  if (!validator) {
    throw new Error(`Validator ${title} not present in plutus.json`);
  }
  return validator;
}

export function readValidator(title: string): SpendingValidator {
  const validator = getPlutusBlueprint(title);
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compiledCode))),
  };
}

export function getAlwaysFailAddrBech32(lucid: Lucid) {
  const alwaysFailValidator = readValidator("always_fail.always_fail");
  return lucid.utils.validatorToAddress(
    alwaysFailValidator,
  );
}
