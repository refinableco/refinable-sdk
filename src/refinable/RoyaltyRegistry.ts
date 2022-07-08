import { ContractTypes } from "../@types/graphql";
import { Contract } from "../Contract";
import { RoyaltyType } from "../enums/royalty-type.enum";
import { LibPart } from "../interfaces/LibPart";
import { Chain } from "../interfaces/Network";
import { Refinable } from "./Refinable";

export { RoyaltyType };

export class RoyaltyRegistry {
  private contract: Contract;
  private provider: any;
  constructor(
    private readonly refinable: Refinable,
    private readonly chainId: Chain
  ) {
    this.provider = this.refinable.evm.getProviderByChainId(this.chainId);
  }

  private async _lazyGetContract() {
    if (this.contract) {
      return this.contract;
    }

    const contract =
      await this.refinable.evm.contracts.getRefinableContractByType(
        this.chainId,
        [ContractTypes.RoyaltyRegistry]
      );

    this.contract = contract;
    return contract;
  }

  async getRoyaltyInfo(contractAddress: string) {
    const contract = await this._lazyGetContract();

    const royaltyInfo = await contract
      .toEthersContract(this.provider)
      .getRoyaltyInfoForToken(contractAddress, "1");

    const [royaltyType, royalties] = royaltyInfo;

    return {
      type: Object.values(RoyaltyType)[royaltyType.toNumber()],
      royalties: royalties.map((royalty) => ({
        account: royalty.account,
        value: royalty.value.toNumber(),
      })),
    };
  }

  async setRoyaltiesByToken(contractAddress: string, royalties: LibPart[]) {
    const contract = await this._lazyGetContract();

    console.log({ contractAddress, royalties });

    return await contract
      .toEthersContract()
      .setRoyaltiesByToken(contractAddress, royalties);
  }

  async clearRoyaltiesType(contractAddress: string) {
    const contract = await this._lazyGetContract();

    await contract.toEthersContract().clearRoyaltiesType(contractAddress);
  }
}
