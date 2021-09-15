import * as ethers from "ethers";
import { PriceCurrency } from "./@types/graphql";

export function isNewRoyaltyContract(address: string) {
  return "0xB2A93B548327d59a2819DEdbC791447d16a11B42"
    .split(",")
    .map((address) => address.toLowerCase())
    .includes(address.toLowerCase());
}

const tokenAddresses = {
  1337: {
    Usdt: "0x0000000000000000000000000000000000000000",
    Bnb: "0x0000000000000000000000000000000000000000",
  },
  97: {
    Busd: "0x8301f2213c0eed49a7e28ae4c3e91722919b8b47",
    Usdt: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
    Bnb: "0x0000000000000000000000000000000000000000",
  },
  56: {
    Usdt: "0x55d398326f99059ff775485246999027b3197955",
    Bnb: "0x0000000000000000000000000000000000000000",
  },
};

export function getERC20Contract(chainId: number, currency: PriceCurrency) {
  const address = tokenAddresses[chainId]?.[currency];

  if (!address) {
    throw new Error(`Unable to handle this token ${currency} in this env`);
  }

  return new ethers.Contract(address, [
    `function approve(address _spender, uint256 _value)`,
  ]);
}

export function getERC20Address(chainId: number, currency: PriceCurrency) {
  const address = tokenAddresses[chainId]?.[currency];

  if (!address) {
    throw new Error(`Unable to handle this token ${currency} in this env`);
  }

  return address;
}
