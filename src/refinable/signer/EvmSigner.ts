import type {
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { utils } from "ethers";
import {
  AccountSigner,
  KindaSigner,
  ProviderSignerWallet,
  EIP712,
  isEIP712,
} from "../../interfaces/Signer";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import EvmAccount from "../account/EvmAccount";
import { TypedDataSigner } from "@ethersproject/abstract-signer";

export default class EvmSigner extends EvmAccount implements AccountSigner {
  constructor(
    protected readonly providerOrSigner: ProviderSignerWallet,
    protected readonly evmOptions: RefinableEvmOptions
  ) {
    super(providerOrSigner, evmOptions);
  }

  async sign(message: string | EIP712) {
    let signature;
    if (isEIP712(message)) {
      signature = await (
        this._signer as unknown as TypedDataSigner
      )._signTypedData(message.domain, message.types, message.value);
    } else {
      signature = await this._signer.signMessage(utils.arrayify(message));
    }

    // WARNING! DO NOT remove!
    // this piece of code seems strange, but it fixes a lot of signatures that are faulty due to ledgers
    // ethers includes a lot of logic to fix these incorrect signatures
    // incorrect signatures often end on 00 or 01 instead of 1b or 1c, ethers has support for this
    const pieces = utils.splitSignature(signature);
    const reconstructed = utils.joinSignature(pieces);

    return reconstructed;
  }

  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    // Not all signers provide this functionality
    if (typeof (this._signer as KindaSigner)._signTypedData === "undefined")
      throw new Error("Signing type data is not supported");

    return (this._signer as KindaSigner)._signTypedData(domain, types, value);
  }
}
