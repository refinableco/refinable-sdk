import { Refinable } from "../..";
import { AccountSigner } from "../../interfaces/Signer";
import SolanaAccount from "../account/SolanaAccount";

export default class SolanaSigner extends SolanaAccount implements AccountSigner {
  constructor(refinable: Refinable) {
    super(refinable);
  }

  async sign(rawMessage: string) {
    const message = new TextEncoder().encode(rawMessage);

    const signature = await this.refinable.provider.signMessage(message);

    let signedSignature = signature;

    // On phantomwallet its .signature, solflare just returns the signature
    if (
      !(signedSignature instanceof Uint8Array) &&
      signature.signature instanceof Uint8Array
    ) {
      signedSignature = signature.signature;
    }

    return this.uintArrayToBase64(signedSignature);
  }

  private uintArrayToBase64(uintArray) {
    let s = "";
    uintArray.filter(function (v) {
      s += String.fromCharCode(v);
      return false;
    });
    return window.btoa(s);
  }
}
