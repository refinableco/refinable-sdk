import { BigNumber, ethers } from "ethers";
import { Account } from "../../interfaces/Account";
import { RefinableEvmClient } from "../RefinableEvmClient";

export default class EvmAccount implements Account {
  constructor(
    private readonly ethAddress: string,
    private readonly refinable: RefinableEvmClient
  ) {}

  /**
   * Balance of Any Token (converted from wei).
   * @return {Promise<string>}
   */
  public async getTokenBalance(tokenAddress: string): Promise<string> {
    if (tokenAddress == null) return null;

    let result = null;
    const decimals = await this.getTokenDecimals(tokenAddress);

    try {
      const token = new ethers.Contract(
        tokenAddress,
        [
          {
            constant: true,
            inputs: [
              {
                name: "_owner",
                type: "address",
              },
            ],
            name: "balanceOf",
            outputs: [
              {
                name: "balance",
                type: "uint256",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        this.refinable.provider
      );
      const balance = await token.balanceOf(this.ethAddress);
      const exp = BigNumber.from(10).pow(decimals);
      result = BigNumber.from(balance).div(exp).toString();
    } catch (e) {
      console.error(`ERROR: Failed to get the balance: ${e.message}`);
    }
    return result;
  }

  /**
   * Decimals of Any Token
   * @return {Promise<number>}
   */
  public async getTokenDecimals(tokenAddress: string): Promise<number> {
    let decimals = 18;
    if (tokenAddress == null) return decimals;

    try {
      const token = new ethers.Contract(
        tokenAddress,
        [
          {
            constant: true,
            inputs: [],
            name: "decimals",
            outputs: [{ name: "", type: "uint8" }],
            type: "function",
          },
        ],
        this.refinable.provider
      );
      decimals = await token.decimals();
    } catch (e) {
      console.error(`ERROR: Failed to get decimals : ${e.message}`);
    }
    return decimals;
  }

  /**
   * Balance of Native currency.(converted from wei).
   * @return {Promise<string>}
   */
  public async getBalance(chainId?: number): Promise<string> {
    const getBalancePromise = chainId
      ? this.refinable.getProviderByChainId(chainId).getBalance(this.ethAddress)
      : this.refinable.provider.getBalance();

    const result = await getBalancePromise;
    return ethers.utils.formatEther(result).toString();
  }
}
