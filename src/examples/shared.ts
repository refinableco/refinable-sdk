import { REFINABLE_NETWORK } from "../constants/network";
import { Chain } from "../interfaces/Network";
import { createWallet } from "../providers";
import { NftRegistry, Refinable } from "../Refinable";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export async function setupNft<K extends keyof NftRegistry>(type: K) {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);

  const refinable = await Refinable.create(wallet, "API_KEY_TEST", {
    waitConfirmations: 1,
  });

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts(["ERC721_TOKEN"]);

  const { contractAddress } = refinableContracts[0] ?? {};

  // SDK: create an nft
  const nft = await refinable.createNft(type, {
    chainId: Chain.BscTestnet,
    contractAddress,
  });

  return nft as NftRegistry[K];
}
