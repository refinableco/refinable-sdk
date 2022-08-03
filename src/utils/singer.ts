import { ethers, providers, Signer } from "ethers";
import { ProviderSignerWallet } from "../interfaces/Signer";

export function getSignerAndProvider(
  network: ProviderSignerWallet
): [Signer | undefined, providers.Provider] {
  let signer: Signer | undefined;
  let provider: providers.Provider | undefined;

  if (Signer.isSigner(network)) {
    signer = network;
    if (network.provider) {
      provider = network.provider;
    }
  }

  if (!provider) {
    if (providers.Provider.isProvider(network)) {
      provider = network;
    } else if (!Signer.isSigner(network)) {
      // no a signer, not a provider, not a string? try with default provider
      provider = ethers.getDefaultProvider(network);
    }
  }

  if (!provider) {
    // we should really never hit this case!
    provider = ethers.getDefaultProvider();
    console.error(
      "No provider found, using default provider on default chain!"
    );
  }

  return [signer, provider];
}
