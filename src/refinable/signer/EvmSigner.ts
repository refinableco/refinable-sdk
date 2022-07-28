import { utils } from "ethers";
import { Refinable } from "../..";
import { AccountSigner } from "../../interfaces/Signer";
import EvmAccount from "../account/EvmAccount";

export default class EvmSigner extends EvmAccount implements AccountSigner {
  constructor(refinable: Refinable) {
    super(refinable);
  }

  async sign(message: string) {
    const signature = await this.refinable.provider.signMessage(
      utils.arrayify(message)
    );

    // WARNING! DO NOT remove!
    // this piece of code seems strange, but it fixes a lot of signatures that are faulty due to ledgers
    // ethers includes a lot of logic to fix these incorrect signatures
    // incorrect signatures often end on 00 or 01 instead of 1b or 1c, ethers has support for this
    const pieces = utils.splitSignature(signature);
    const reconstructed = utils.joinSignature(pieces);

    return reconstructed;
  }
}
