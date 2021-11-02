import { SolNFTItem, RefinableSolana } from "../RefinableSolana";
import { AmountRange, IPartialCreateAuctionArgs, ParsedAccount, PriceFloor, PriceFloorType, WhitelistedCreator, WinnerLimit, WinnerLimitType, WinningConfigType } from "../solana/oyster";
import { QUOTE_MINT } from "../solana/constants";
import { AuctionCategory, AuctionState } from "../interfaces";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { createAuctionManager } from "../solana/actions/createAuctionManager";
export class SOLNFT {
    private _item: SolNFTItem
    constructor(private readonly refinable: RefinableSolana, item: SolNFTItem) {
        this._item = item;
    }

    async putForSale(whitelistedCreatorsByCreator: Record<string, ParsedAccount<WhitelistedCreator>>, paymentMint = QUOTE_MINT.toBase58(), price = 1) {
      const attributes: AuctionState = {
        reservationPrice: 0,
        items: [this._item],
        category: AuctionCategory.InstantSale,
        auctionDurationType: 'minutes',
        gapTimeType: 'minutes',
        winnersCount: 1,
        startSaleTS: new Date().getTime(),
        startListTS: new Date().getTime(),
        instantSalePrice: price,
        priceFloor: 1
      }
    
      let winnerLimit: WinnerLimit;
      if (attributes.items.length > 0) {
        const item = attributes.items[0];
        if (!attributes.editions) {
          item.winningConfigType =
            item.metadata.info.updateAuthority ===
            (this.refinable.provider?.publicKey || SystemProgram.programId).toBase58()
              ? WinningConfigType.FullRightsTransfer
              : WinningConfigType.TokenOnlyTransfer;
        }
        item.amountRanges = [
          new AmountRange({
            amount: new BN(1),
            length: new BN(attributes.editions || 1),
          }),
        ];
      }

      // TODO: Support for editions

      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(attributes.editions || 1),
      });
    
      const auctionSettings: IPartialCreateAuctionArgs = {
        winners: winnerLimit,
        endAuctionAt: null, // instant sale
        auctionGap: null, // instant sale
        priceFloor: new PriceFloor({
          type: PriceFloorType.Minimum,
          minPrice: new BN((attributes.priceFloor || 0) * LAMPORTS_PER_SOL),
        }),
        tokenMint: this._item.tokenId,
        gapTickSizePercentage: attributes.tickSizeEndingPhase || null,
        tickSize: attributes.priceTick
          ? new BN(attributes.priceTick * LAMPORTS_PER_SOL)
          : null,
        instantSalePrice: attributes.instantSalePrice
          ? new BN((attributes.instantSalePrice || 0) * LAMPORTS_PER_SOL)
          : null,
        name: null,
      };

      await createAuctionManager(this.refinable.connection, this.refinable.provider, whitelistedCreatorsByCreator, auctionSettings, 
        attributes.items,
        attributes.participationNFT,
        paymentMint);  
    }
}
