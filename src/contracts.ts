import * as ethers from "ethers";

import refinableERC721TokenABI from "./abi/refinableERC721Token.abi.json";
import refinableERC1155TokenABI from "./abi/refinableERC1155Token.abi.json";
import refinableERC721SaleABI from "./abi/refinableERC721Sale.abi.json";
import refinableERC1155SaleABI from "./abi/refinableERC1155Sale.abi.json";
import erc1155SaleNonceHolderABI from "./abi/erc1155SaleNonceHolder.abi.json";
import erc721SaleNonceHolderABI from "./abi/erc721SaleNonceHolder.abi.json";

import refinableERC721WhiteListedTokenABI from "./abi/refinableERC721WhiteListedToken.abi.json";
import refinableERC721WhiteListedTokenV2ABI from "./abi/refinableERC721WhiteListedTokenV2.abi.json";

import { REFINABLE_CURRENCY } from "./constants/currency";
import { TOKEN_TYPE } from "./nft/nft";

// nextjs doesnt correctly destructure process.env
export const erc721TokenAddress = "0x7Da893FAf70cE5f4CEEF42A6e526Ae62b3DC02F5";
export const erc1155TokenAddress = "0x76De4E88Fb130c9eb6e0Be00891cB378e2Eb2155";
export const transferProxyAddress: string =
  "0xeA3F750Caa963F0967472540551E2a135f1717C9";

export const erc721SaleAddress = "0xffA18fb5a09A6107A66daf71BBaa743B4FCf2168";
export const erc721SaleNonceHolderAddress =
  "0xAE1Db9A140BaA98185913Fc76BCEA0A02527a39A";

export const erc115SaleAddress = "0xa535a6119E1d20C0d8185E487bb58463Ba56732c";
export const erc1155SaleNonceHolderAddress =
  "0x4Bc5741Ee7B8F7Ed527e059679fD65D3EC168B35";

export const erc721TokenContract = new ethers.Contract(
  erc721TokenAddress,
  refinableERC721TokenABI
);

export const erc721SaleContract = new ethers.Contract(
  erc721SaleAddress,
  refinableERC721SaleABI
);

export const erc721SaleNonceHolderContract = new ethers.Contract(
  erc721SaleNonceHolderAddress,
  erc721SaleNonceHolderABI
);

export const erc1155TokenContract = new ethers.Contract(
  erc1155TokenAddress,
  refinableERC1155TokenABI
);

export const erc1155SaleContract = new ethers.Contract(
  erc115SaleAddress,
  refinableERC1155SaleABI
);

export const erc1155SaleNonceHolderContract = new ethers.Contract(
  erc1155SaleNonceHolderAddress,
  erc1155SaleNonceHolderABI
);

export function getTokenContract(address: string, type: string) {
  let ABI;
  if (type === TOKEN_TYPE.ERC721) {
    if (isNewRoyaltyContract(address)) {
      ABI = refinableERC721WhiteListedTokenV2ABI;
    } else {
      ABI =
        address === erc721TokenAddress
          ? refinableERC721TokenABI
          : refinableERC721WhiteListedTokenABI;
    }
  } else {
    ABI = refinableERC1155TokenABI;
  }
  return new ethers.Contract(address, ABI);
}

export function isNewRoyaltyContract(address: string) {
  return "0xB2A93B548327d59a2819DEdbC791447d16a11B42"
    .split(",")
    .map((address) => address.toLowerCase())
    .includes(address.toLowerCase());
}

const tokenAddresses = {
  local: {
    USDT: "0x0000000000000000000000000000000000000000",
    BNB: "0x0000000000000000000000000000000000000000",
  },
  testnet: {
    BUSD: "0x8301f2213c0eed49a7e28ae4c3e91722919b8b47",
    USDT: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
    BNB: "0x0000000000000000000000000000000000000000",
  },
  mainnet: {
    USDT: "0x55d398326f99059ff775485246999027b3197955",
    BNB: "0x0000000000000000000000000000000000000000",
  },
};

type Environment = "local" | "testnet" | "mainnet";

export function getERC20Contract(currency: REFINABLE_CURRENCY) {
  const address = tokenAddresses["mainnet"]?.[currency];

  if (!address) {
    throw new Error(`Unable to handle this token ${currency} in this env`);
  }

  return new ethers.Contract(address, [
    `function approve(address _spender, uint256 _value)`,
  ]);
}

export function getERC20Address(currency: REFINABLE_CURRENCY) {
  const address = tokenAddresses["mainnet"]?.[currency];

  if (!address) {
    throw new Error(`Unable to handle this token ${currency} in this env`);
  }

  return address;
}
