import { Chain } from "../interfaces/Network";
import { createWallet } from "../providers";
import { NftRegistry, Refinable } from "../Refinable";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export async function setupNft<K extends keyof NftRegistry>(type: K) {
  const chainId = Chain.EthereumRinkeby;

  const wallet = createWallet(PRIVATE_KEY, chainId);

  const refinable = await Refinable.create(wallet, "API_KEY_TEST", {
    waitConfirmations: 1,
  });

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts(chainId, [
    "ERC721_TOKEN",
  ]);

  const { contractAddress } = refinableContracts[0] ?? {};

  // SDK: create an nft
  const nft = await refinable.createNft(type, {
    contractAddress,
    chainId,
  });

  return nft as NftRegistry[K];
}
