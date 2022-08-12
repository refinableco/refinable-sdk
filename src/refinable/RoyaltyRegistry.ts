import { ContractTypes } from "../@types/graphql";
import { getProviderByNetworkId } from "../config/chains";
import { RoyaltyType } from "../enums/royalty-type.enum";
import { LibPart } from "../interfaces/LibPart";
import { Chain } from "../interfaces/Network";
import { ContractWrapper } from "./contract/ContractWrapper";
import { Refinable } from "./Refinable";

export { RoyaltyType };

export class RoyaltyRegistry {
  private contract: ContractWrapper;
  private chainProvider: any;
  constructor(
    private readonly refinable: Refinable,
    private readonly chainId: Chain
  ) {
    this.chainProvider = getProviderByNetworkId(this.chainId);
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

    contract.connect(this.refinable.provider ?? this.chainProvider);

    this.contract = contract.contractWrapper;
    return this.contract;
  }

  async getRoyaltyInfo(contractAddress: string, tokenId = "1") {
    const lazyContract = await this._lazyGetContract();

    const royaltyInfo = await lazyContract.contract.getRoyaltyInfoForToken(
      contractAddress,
      tokenId
    );

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
    const lazyContract = await this._lazyGetContract();

    const response = await lazyContract.sendTransaction("setRoyaltiesByToken", [
      contractAddress,
      royalties,
    ]);

    return response;
  }

  async clearRoyaltiesType(contractAddress: string) {
    const lazyContract = await this._lazyGetContract();

    const response = await lazyContract.sendTransaction("clearRoyaltiesType", [
      contractAddress,
    ]);

    return response;
  }
}
