import { BigNumber, ethers } from "ethers";
import { Chain } from "../interfaces/Network";

/**
 * @internal
 */
function getGasStationUrl(chainId: Chain.PolygonMainnet | Chain.PolygonTestnet): string {
  switch (chainId) {
    case Chain.PolygonMainnet:
      return "https://gasstation-mainnet.matic.network/v2";
    case Chain.PolygonTestnet:
      return "https://gasstation-mumbai.matic.today/v2";
  }
}

const MIN_POLYGON_GAS_PRICE = ethers.utils.parseUnits("31", "gwei");
const MIN_MUMBAI_GAS_PRICE = ethers.utils.parseUnits("1", "gwei");

/**
 * @internal
 */
function getDefaultGasFee(
  chainId: Chain.PolygonMainnet | Chain.PolygonTestnet,
): BigNumber {
  switch (chainId) {
    case Chain.PolygonMainnet:
      return MIN_POLYGON_GAS_PRICE;
    case Chain.PolygonTestnet:
      return MIN_MUMBAI_GAS_PRICE;
  }
}

/**
 *
 * @returns the gas price
 * @internal
 */
export async function getPolygonGasPriorityFee(
  chainId: Chain.PolygonMainnet | Chain.PolygonTestnet,
): Promise<BigNumber> {
  const gasStationUrl = getGasStationUrl(chainId);
  try {
    const data = await (await fetch(gasStationUrl)).json();
    // take the standard speed here, SDK options will define the extra tip
    const priorityFee = data["standard"]["maxPriorityFee"];
    if (priorityFee > 0) {
      const fixedFee = parseFloat(priorityFee).toFixed(9);
      return ethers.utils.parseUnits(fixedFee, "gwei");
    }
  } catch (e) {
    console.error("failed to fetch gas", e);
  }
  return getDefaultGasFee(chainId);
}