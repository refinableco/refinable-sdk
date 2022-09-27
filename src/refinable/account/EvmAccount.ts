import { ethers, providers } from "ethers";
import { toBN } from "web3-utils";
import { getProviderByNetworkId } from "../../config/chains";
import { Account } from "../../interfaces/Account";
import { NativeCurrency } from "../../interfaces/Config";
import { ProviderSignerWallet } from "../../interfaces/Signer";
import EvmTransaction from "../../transaction/EvmTransaction";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { getSignerAndProvider } from "../../utils/singer";
import { ContractWrapper } from "../contract/ContractWrapper";

export default class EvmAccount implements Account {
  public _provider: providers.Provider;
  public _signer: ethers.Signer;
  constructor(
    protected readonly providerOrSigner: ProviderSignerWallet,
    protected readonly evmOptions: RefinableEvmOptions
  ) {
    const [signer, provider] = getSignerAndProvider(providerOrSigner);
    this._provider = provider;
    this._signer = signer;
  }

  async getAddress(): Promise<string> {
    return this._signer.getAddress();
  }

  /**
   * Balance of Any Token (converted from wei).
   * @return {Promise<string>}
   */
  public async getTokenBalance(
    tokenAddress: string,
    userEthAddress?: string
  ): Promise<string> {
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
        this._signer
      );
      const balance = await token.balanceOf(
        userEthAddress ?? (await this.getAddress())
      );
      result = toBN(ethers.utils.formatUnits(balance, decimals)).toString();
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
        this._signer
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
  public async getBalance(
    chainId?: number,
    userEthAddress?: string
  ): Promise<string> {
    const getBalancePromise = chainId
      ? getProviderByNetworkId(chainId).getBalance(
          userEthAddress ?? (await this.getAddress())
        )
      : this._signer.getBalance();

    const result = await getBalancePromise;
    return ethers.utils.formatEther(result).toString();
  }

  /**
   * Approve a certain allowance for a ERC20 token
   * @param token
   * @param amount
   * @param spenderAddress
   * @returns {Promise<EvmTransaction>}
   */
  public async approveTokenContractAllowance(
    token: NativeCurrency,
    amount: number,
    spenderAddress: string
  ): Promise<EvmTransaction> {
    // Native currency does not need to be approved
    if (token.native === true) return;

    const erc20Contract = new ContractWrapper(
      {
        address: token.address,
        abi: [
          `function approve(address _spender, uint256 _value)`,
          `function allowance(address _owner, address _spender) public view returns (uint remaining)`,
        ],
        chainId: (await this._provider.getNetwork()).chainId,
      },
      this.providerOrSigner,
      this.evmOptions
    );

    const formattedAmount = ethers.utils.parseUnits(
      amount.toString(),
      token.decimals
    );

    const address = await this.getAddress();
    const allowed = await erc20Contract.contract.allowance(
      address,
      spenderAddress
    );

    if (allowed.lt(formattedAmount)) {
      if (!allowed.eq(0)) {
        /**
         * ATTENTION: Regarding balances of ERC20 tokens
         *
         * For now this only seems to be impacting USDT on ETHEREUM
         *
         * USDT has a non-standard ERC20 implementation, they don't support increase/decreaseAllowance
         * It would be better to use increase/decrease to prevent 2 calls, but for simplicity we set to 0 and then to approved amount again
         * having to increase/decrease is actually a result of a failing amount before
         */
        if (
          token.name === "USDT" &&
          token.address.toLowerCase() ==
            "0xdac17f958d2ee523a2206206994597c13d831ec7"
        ) {
          // FROM USDT: https://etherscan.io/address/0xdAC17F958D2ee523a2206206994597C13D831ec7#code
          // To change the approve amount you first have to reduce the addresses`
          //  allowance to zero by calling `approve(_spender, 0)` if it is not
          //  already 0 to mitigate the race condition described here:
          //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
          await erc20Contract.sendTransaction("approve", [spenderAddress, 0]);
        }
      }

      await erc20Contract.sendTransaction("approve", [
        spenderAddress,
        formattedAmount.toString(),
      ]);
    }
    return;
  }
}
