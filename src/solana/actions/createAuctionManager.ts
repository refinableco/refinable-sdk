import { WhitelistedCreator } from "@metaplex-foundation/mpl-metaplex";
import {
  EditionData,
  MasterEditionData,
  MetadataKey,
} from "@metaplex-foundation/mpl-token-metadata";
import { AccountLayout } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  AmountRange,
  createTokenAccount,
  getAuctionKeys,
  getEdition,
  // SequenceType,
  // sendTransactions,
  getSafetyDepositBox,
  // createAssociatedTokenAccountInstruction,
  // sendTransactionWithRetry,
  // findProgramAddress,
  IPartialCreateAuctionArgs,
  Metadata,
  ParticipationConfigV2,
  ParticipationStateV2,
  SafetyDepositConfig,
  startAuction,
  TupleNumericType,
  WinningConfigType,
} from "../oyster";
import { ParsedAccount } from "../oyster/contexts/accounts/types";
import {
  sendTransactions,
  sendTransactionWithRetry,
  SequenceType,
} from "../oyster/contexts/connection";
import { WalletSigner } from "../oyster/contexts/wallet";
import { initAuctionManagerV2 } from "../oyster/models/metaplex/initAuctionManagerV2";
import { validateSafetyDepositBoxV2 } from "../oyster/models/metaplex/validateSafetyDepositBoxV2";
import {
  findProgramAddress,
  programIds,
  StringPublicKey,
  toPublicKey,
} from "../utils";
import {
  addTokensToVault,
  SafetyDepositInstructionTemplate,
} from "./addTokensToVault";
import { closeVault } from "./closeVault";
import { createExternalPriceAccount } from "./createExternalPriceAccount";
import { createVault } from "./createVault";
import { makeAuction } from "./makeAuction";
import { setVaultAndAuctionAuthorities } from "./setVaultAndAuctionAuthorities";
export interface SafetyDepositDraft {
  metadata: ParsedAccount<Metadata>;
  masterEdition?: MasterEditionData;
  edition?: EditionData;
  holding: StringPublicKey;
  printingMintHolding?: StringPublicKey;
  winningConfigType: WinningConfigType;
  amountRanges: AmountRange[];
  participationConfig?: ParticipationConfigV2;
}

// This is a super command that executes many transactions to create a Vault, Auction, and AuctionManager starting
// from some AuctionManagerSettings.
export async function createAuctionManager(
  connection: Connection,
  wallet: WalletSigner,
  storePubKey: StringPublicKey,
  auctionSettings: IPartialCreateAuctionArgs,
  safetyDepositDrafts: SafetyDepositDraft[],
  participationSafetyDepositDraft: SafetyDepositDraft | undefined,
  paymentMint: StringPublicKey
): Promise<{
  vault: StringPublicKey;
  auction: StringPublicKey;
  auctionManager: StringPublicKey;
}> {
  console.log("createAuctionManager", {
    auctionSettings,
    safetyDepositDrafts,
    participationSafetyDepositDraft,
    paymentMint,
  });

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const {
    externalPriceAccount,
    priceMint,
    instructions: epaInstructions,
    signers: epaSigners,
  } = await createExternalPriceAccount(connection, wallet);

  const {
    instructions: createVaultInstructions,
    signers: createVaultSigners,
    vault,
    fractionalMint,
    redeemTreasury,
    fractionTreasury,
  } = await createVault(connection, wallet, priceMint, externalPriceAccount);

  const {
    instructions: makeAuctionInstructions,
    signers: makeAuctionSigners,
    auction,
  } = await makeAuction(wallet, vault, auctionSettings);

  const safetyDepositConfigs = await buildSafetyDepositArray(
    wallet,
    safetyDepositDrafts,
    participationSafetyDepositDraft
  );

  const {
    instructions: auctionManagerInstructions,
    signers: auctionManagerSigners,
    auctionManager,
  } = await setupAuctionManagerInstructions(
    wallet,
    storePubKey,
    vault,
    paymentMint,
    accountRentExempt,
    safetyDepositConfigs,
    auctionSettings
  );

  const {
    instructions: addTokenInstructions,
    signers: addTokenSigners,
    safetyDepositTokenStores,
  } = await addTokensToVault(connection, wallet, vault, safetyDepositConfigs);

  const lookup = {
    externalPriceAccount: {
      instructions: epaInstructions,
      signers: epaSigners,
    },
    createVault: {
      instructions: createVaultInstructions,
      signers: createVaultSigners,
    },
    closeVault: await closeVault(
      connection,
      wallet,
      vault,
      fractionalMint,
      fractionTreasury,
      redeemTreasury,
      priceMint,
      externalPriceAccount
    ),
    addTokens: { instructions: addTokenInstructions, signers: addTokenSigners },
    makeAuction: {
      instructions: makeAuctionInstructions,
      signers: makeAuctionSigners,
    },
    initAuctionManager: {
      instructions: auctionManagerInstructions,
      signers: auctionManagerSigners,
    },
    setVaultAndAuctionAuthorities: await setVaultAndAuctionAuthorities(
      wallet,
      vault,
      auction,
      auctionManager
    ),
    startAuction: await setupStartAuction(wallet, storePubKey, vault),
    validateBoxes: await validateBoxes(
      wallet,
      storePubKey,
      vault,
      safetyDepositConfigs.filter(
        (c) =>
          !participationSafetyDepositDraft ||
          // Only V1s need to skip normal validation and use special endpoint
          (participationSafetyDepositDraft.masterEdition?.key ==
            MetadataKey.MasterEditionV1 &&
            c.draft.metadata.pubkey !==
              participationSafetyDepositDraft.metadata.pubkey) ||
          participationSafetyDepositDraft.masterEdition?.key ==
            MetadataKey.MasterEditionV2
      ),
      safetyDepositTokenStores
    ),
  };

  const signers: Keypair[][] = [
    lookup.externalPriceAccount.signers,
    lookup.createVault.signers,
    ...lookup.addTokens.signers,
    lookup.closeVault.signers,
    lookup.makeAuction.signers,
    lookup.initAuctionManager.signers,
    lookup.setVaultAndAuctionAuthorities.signers,
    ...lookup.validateBoxes.signers,
    lookup.startAuction.signers,
  ];
  const toRemoveSigners: Record<number, boolean> = {};

  // console.log('lookup: ',lookup);

  let instructions: TransactionInstruction[][] = [
    lookup.externalPriceAccount.instructions,
    lookup.createVault.instructions,
    ...lookup.addTokens.instructions,
    lookup.closeVault.instructions,
    lookup.makeAuction.instructions,
    lookup.initAuctionManager.instructions,
    lookup.setVaultAndAuctionAuthorities.instructions,
    ...lookup.validateBoxes.instructions,
    lookup.startAuction.instructions,
  ].filter((instr, i) => {
    if (instr.length > 0) {
      return true;
    } else {
      toRemoveSigners[i] = true;
      return false;
    }
  });

  let filteredSigners = signers.filter((_, i) => !toRemoveSigners[i]);

  let stopPoint = 0;
  let tries = 0;
  let lastInstructionsLength: number | null = null;
  // console.log('instructions.length: ', instructions.length);

  while (stopPoint < instructions.length && tries < 3) {
    // console.log('instructions.length: ', instructions.length);
    instructions = instructions.slice(stopPoint, instructions.length);
    filteredSigners = filteredSigners.slice(stopPoint, filteredSigners.length);

    if (instructions.length === lastInstructionsLength) tries = tries + 1;
    else tries = 0;

    try {
      if (instructions.length === 1) {
        await sendTransactionWithRetry(
          connection,
          wallet,
          instructions[0],
          filteredSigners[0],
          "single"
        );
        stopPoint = 1;
      } else {
        // console.log('instructions: ',JSON.stringify(instructions));

        stopPoint = await sendTransactions(
          connection,
          wallet,
          instructions,
          filteredSigners,
          SequenceType.StopOnFailure,
          "single"
        );
      }
    } catch (e) {
      console.error(e);
    }
    console.log(
      "Died on ",
      stopPoint,
      "retrying from instruction",
      // instructions[stopPoint],
      "instructions length is",
      instructions.length
    );
    lastInstructionsLength = instructions.length;
  }

  if (stopPoint < instructions.length) throw new Error("Failed to create");

  return { vault, auction, auctionManager };
}

async function buildSafetyDepositArray(
  wallet: WalletSigner,
  safetyDeposits: SafetyDepositDraft[],
  participationSafetyDepositDraft: SafetyDepositDraft | undefined
): Promise<SafetyDepositInstructionTemplate[]> {
  const safetyDepositTemplates: SafetyDepositInstructionTemplate[] = [];
  safetyDeposits.forEach((s, i) => {
    const maxAmount = [...s.amountRanges.map((a) => a.amount)]
      .sort()
      .reverse()[0];

    const maxLength = [...s.amountRanges.map((a) => a.length)]
      .sort()
      .reverse()[0];
    safetyDepositTemplates.push({
      box: {
        tokenAccount:
          s.winningConfigType !== WinningConfigType.PrintingV1
            ? s.holding
            : s.printingMintHolding,
        tokenMint:
          s.winningConfigType !== WinningConfigType.PrintingV1
            ? s.metadata.info.mint
            : (s.masterEdition as any)?.printingMint,
        amount:
          s.winningConfigType == WinningConfigType.PrintingV2 ||
          s.winningConfigType == WinningConfigType.FullRightsTransfer
            ? new BN(1)
            : new BN(
                s.amountRanges.reduce(
                  (acc, r) => acc.add(r.amount.mul(r.length)),
                  new BN(0)
                )
              ),
      },
      config: new SafetyDepositConfig({
        directArgs: {
          auctionManager: SystemProgram.programId.toBase58(),
          order: new BN(i),
          amountRanges: s.amountRanges,
          amountType: maxAmount.gte(new BN(254))
            ? TupleNumericType.U16
            : TupleNumericType.U8,
          lengthType: maxLength.gte(new BN(254))
            ? TupleNumericType.U16
            : TupleNumericType.U8,
          winningConfigType: s.winningConfigType,
          participationConfig: null,
          participationState: null,
        },
      }),
      draft: s,
    });
  });

  if (
    participationSafetyDepositDraft &&
    participationSafetyDepositDraft.masterEdition
  ) {
    const maxAmount = [
      ...participationSafetyDepositDraft.amountRanges.map((s) => s.amount),
    ]
      .sort()
      .reverse()[0];
    const maxLength = [
      ...participationSafetyDepositDraft.amountRanges.map((s) => s.length),
    ]
      .sort()
      .reverse()[0];
    const config = new SafetyDepositConfig({
      directArgs: {
        auctionManager: SystemProgram.programId.toBase58(),
        order: new BN(safetyDeposits.length),
        amountRanges: participationSafetyDepositDraft.amountRanges,
        amountType: maxAmount?.gte(new BN(255))
          ? TupleNumericType.U32
          : TupleNumericType.U8,
        lengthType: maxLength?.gte(new BN(255))
          ? TupleNumericType.U32
          : TupleNumericType.U8,
        winningConfigType: WinningConfigType.Participation,
        participationConfig:
          participationSafetyDepositDraft.participationConfig || null,
        participationState: new ParticipationStateV2({
          collectedToAcceptPayment: new BN(0),
        }),
      },
    });

    if (
      participationSafetyDepositDraft.masterEdition.key ==
      MetadataKey.MasterEditionV1
    ) {
      const me = participationSafetyDepositDraft.masterEdition as any;
      safetyDepositTemplates.push({
        box: {
          tokenAccount: (
            await findProgramAddress(
              [
                wallet.publicKey.toBuffer(),
                programIds().token.toBuffer(),
                toPublicKey(me?.oneTimePrintingAuthorizationMint).toBuffer(),
              ],
              programIds().associatedToken
            )
          )[0],
          tokenMint: me?.oneTimePrintingAuthorizationMint,
          amount: new BN(1),
        },
        config,
        draft: participationSafetyDepositDraft,
      });
    } else {
      safetyDepositTemplates.push({
        box: {
          tokenAccount: participationSafetyDepositDraft.holding,
          tokenMint: participationSafetyDepositDraft.metadata.info.mint,
          amount: new BN(1),
        },
        config,
        draft: participationSafetyDepositDraft,
      });
    }
  }
  return safetyDepositTemplates;
}

async function setupAuctionManagerInstructions(
  wallet: WalletSigner,
  storePubKey: string,
  vault: StringPublicKey,
  paymentMint: StringPublicKey,
  accountRentExempt: number,
  safetyDeposits: SafetyDepositInstructionTemplate[],
  auctionSettings: IPartialCreateAuctionArgs
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
  auctionManager: StringPublicKey;
}> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  const { auctionManagerKey } = await getAuctionKeys(vault);

  const acceptPayment = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    toPublicKey(paymentMint),
    toPublicKey(auctionManagerKey),
    signers
  ).toBase58();

  let maxRanges = [
    auctionSettings.winners.usize.toNumber(),
    safetyDeposits.length,
    100,
  ].sort()[0];
  if (maxRanges < 10) {
    maxRanges = 10;
  }

  await initAuctionManagerV2(
    vault,
    wallet.publicKey.toBase58(),
    wallet.publicKey.toBase58(),
    acceptPayment,
    storePubKey,
    safetyDeposits.length >= 254 ? TupleNumericType.U16 : TupleNumericType.U8,
    auctionSettings.winners.usize.toNumber() >= 254
      ? TupleNumericType.U16
      : TupleNumericType.U8,
    new BN(maxRanges),
    instructions
  );

  return { instructions, signers, auctionManager: auctionManagerKey };
}

async function setupStartAuction(
  wallet: WalletSigner,
  vault: StringPublicKey,
  storePubKey: StringPublicKey
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  await startAuction(
    vault,
    storePubKey,
    wallet.publicKey.toBase58(),
    instructions
  );

  return { instructions, signers };
}

async function validateBoxes(
  wallet: WalletSigner,
  storePubKey: string,
  vault: StringPublicKey,
  safetyDeposits: SafetyDepositInstructionTemplate[],
  safetyDepositTokenStores: StringPublicKey[]
): Promise<{
  instructions: TransactionInstruction[][];
  signers: Keypair[][];
}> {
  const signers: Keypair[][] = [];
  const instructions: TransactionInstruction[][] = [];

  for (let i = 0; i < safetyDeposits.length; i++) {
    const tokenSigners: Keypair[] = [];
    const tokenInstructions: TransactionInstruction[] = [];

    const safetyDepositBox = await getSafetyDepositBox(
      vault,
      safetyDeposits[i].draft.metadata.info.mint
    );

    const edition: StringPublicKey = await getEdition(
      safetyDeposits[i].draft.metadata.info.mint
    );

    // TODO: do we need this? Our store has to be public
    // TODO: make script to create public store
    const creator = await WhitelistedCreator.getPDA(
      storePubKey,
      wallet.publicKey
    );

    await validateSafetyDepositBoxV2(
      vault,
      safetyDeposits[i].draft.metadata.pubkey,
      safetyDepositBox,
      safetyDepositTokenStores[i],
      safetyDeposits[i].draft.metadata.info.mint,
      wallet.publicKey.toBase58(),
      wallet.publicKey.toBase58(),
      wallet.publicKey.toBase58(),
      tokenInstructions,
      edition,
      undefined,
      storePubKey,
      safetyDeposits[i].config
    );

    signers.push(tokenSigners);
    instructions.push(tokenInstructions);
  }
  return { instructions, signers };
}
