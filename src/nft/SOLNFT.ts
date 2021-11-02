import { NFTItem, RefinableSolana } from "../RefinableSolana";
import { Price } from "../@types/graphql";
import { AmountRange, IPartialCreateAuctionArgs, ParsedAccount, PriceFloor, PriceFloorType, WhitelistedCreator, WinnerLimit, WinnerLimitType, WinningConfigType } from "../solana/oyster";
import { QUOTE_MINT } from "../solana/constants";
import { AuctionCategory, AuctionState } from "../interfaces";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { createAuctionManager } from "../solana/actions/createAuctionManager";
export class SOLNFT {
    private _item: NFTItem
    constructor(private readonly refinable: RefinableSolana, item: NFTItem) {
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
    
      const isInstantSale =
      attributes.instantSalePrice &&
      attributes.priceFloor === attributes.instantSalePrice;
    
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
      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(attributes.editions || 1),
      });
    
      const auctionSettings: IPartialCreateAuctionArgs = {
        winners: winnerLimit,
        endAuctionAt: isInstantSale
          ? null
          : new BN(
              (attributes.auctionDuration || 0) *
                (attributes.auctionDurationType == 'days'
                  ? 60 * 60 * 24 // 1 day in seconds
                  : attributes.auctionDurationType == 'hours'
                  ? 60 * 60 // 1 hour in seconds
                  : 60), // 1 minute in seconds
            ), // endAuctionAt is actually auction duration, poorly named, in seconds
        auctionGap: isInstantSale
          ? null
          : new BN(
              (attributes.gapTime || 0) *
                (attributes.gapTimeType == 'days'
                  ? 60 * 60 * 24 // 1 day in seconds
                  : attributes.gapTimeType == 'hours'
                  ? 60 * 60 // 1 hour in seconds
                  : 60), // 1 minute in seconds
            ),
        priceFloor: new PriceFloor({
          // type: attributes.priceFloor
          //   ? PriceFloorType.Minimum
          //   : PriceFloorType.None,
          type: PriceFloorType.Minimum,
          minPrice: new BN((attributes.priceFloor || 0) * LAMPORTS_PER_SOL),
        }),
        tokenMint: QUOTE_MINT.toBase58(),
        gapTickSizePercentage: attributes.tickSizeEndingPhase || null,
        tickSize: attributes.priceTick
          ? new BN(attributes.priceTick * LAMPORTS_PER_SOL)
          : null,
        instantSalePrice: attributes.instantSalePrice
          ? new BN((attributes.instantSalePrice || 0) * LAMPORTS_PER_SOL)
          : null,
        name: null,
      };
    
      const tieredAttributes = {
        items: [],
        tiers: [],
      }
    
      await createAuctionManager(this.refinable.connection, this.refinable.provider, whitelistedCreatorsByCreator, auctionSettings, 
        attributes.category === AuctionCategory.Open
          ? []
          : attributes.category !== AuctionCategory.Tiered
          ? attributes.items
          : tieredAttributes.items,
        attributes.category === AuctionCategory.Open
        ? attributes.items[0]
        : attributes.participationNFT,
        paymentMint);  
    }
}
