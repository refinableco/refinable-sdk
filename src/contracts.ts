import * as ethers from "ethers";
import { PriceCurrency } from "./@types/graphql";

export function isNewRoyaltyContract(address: string) {
  return "0xB2A93B548327d59a2819DEdbC791447d16a11B42"
    .split(",")
    .map((address) => address.toLowerCase())
    .includes(address.toLowerCase());
}

export function getApproveContract(
  contractAddress: string,
  currency: PriceCurrency
) {
  if (!contractAddress) {
    throw new Error(`Unable to handle this token ${currency} in this env`);
  }

  return new ethers.Contract(contractAddress, [
    `function approve(address _spender, uint256 _value)`,
  ]);
}
