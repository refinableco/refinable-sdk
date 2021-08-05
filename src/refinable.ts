import Web3 from "web3";
import type { provider, AddAccount } from "web3-core";
import { soliditySha3Raw } from "web3-utils";
import { utils } from "ethers";

import {
  ERC721Contract,
  ERC721NonceContract,
  ERC1155NonceContract,
  ERC1155Contract,
} from "./contracts";
import { Network } from "./type";
import {
  ERC721_ADDRESS,
  ERC721_TESTNET_ADDRESS,
  ERC1155_ADDRESS,
  ERC1155_TESTNET_ADDRESS,
} from "./constants";
import { BNB, USDT } from "./constants/currency";
import { GraphqlCustom } from "./graghql/GraphqlCustom";

export class Refinable {
  private _web3: Web3;
  private _token: string;
  private _accountAddress: string;
  private _privateKey: string;
  private _ERC721Contract: ERC721Contract;
  private _ERC721NonceContract: ERC721NonceContract;
  private _ERC1155Contract: ERC1155Contract;
  private _ERC1155NonceContract: ERC1155NonceContract;
  private _GraphqlCustom: GraphqlCustom;
  private _ERC721Address: string;
  private _ERC1155Address: string;

  constructor(
    currentProvider: provider,
    network: Network,
    account?: AddAccount,
    token?: string
  ) {
    this._accountAddress = "";
    this._privateKey = "";
    this._token = token || "";
    const web3 = new Web3(currentProvider);
    if (account) {
      web3.eth.accounts.wallet.add(account);
      this._accountAddress = account.address;
      this._privateKey = account.privateKey;
    }
    this._web3 = web3;

    this._GraphqlCustom = new GraphqlCustom(network);
    this._ERC721Contract = new ERC721Contract(this._web3, network);
    this._ERC721NonceContract = new ERC721NonceContract(this._web3, network);
    this._ERC1155Contract = new ERC1155Contract(this._web3, network);
    this._ERC1155NonceContract = new ERC1155NonceContract(this._web3, network);
    this._ERC721Address =
      network === Network.BCS ? ERC721_ADDRESS : ERC721_TESTNET_ADDRESS;
    this._ERC1155Address =
      network === Network.BCS ? ERC1155_ADDRESS : ERC1155_TESTNET_ADDRESS;
  }

  public async approveNFT({
    tokenId,
    contractAddress,
    nftBillInfo,
  }: {
    tokenId: number;
    contractAddress: string;
    nftBillInfo: {
      supply: number;
      amount: number;
      currency: string;
    };
  }) {
    try {
      let res;

      if (!this._token) {
        await this._getToken();
      }

      if (contractAddress === this._ERC721Address) {
        res = await this._approveNFTForERC721({
          tokenId,
          contractAddress,
          nftBillInfo: {
            amount: nftBillInfo.amount,
            currency: nftBillInfo.currency,
          },
        });
      } else if (contractAddress === this._ERC1155Address) {
        res = await this._approveNFTForERC1155({
          tokenId,
          contractAddress,
          nftBillInfo,
        });
      }

      return res;
    } catch (err) {
      console.error("approveNFT", err);
    }
  }

  private async _approveNFTForERC721({
    tokenId,
    contractAddress,
    nftBillInfo,
  }: {
    tokenId: number;
    contractAddress: string;
    nftBillInfo: {
      currency: string;
      amount: number;
    };
  }) {
    try {
      const isApproved = await this._ERC721Contract.isApprovedForAll({
        accountAddress: this._accountAddress,
      });
      if (!isApproved) {
        await this._ERC721Contract.approve({
          tokenId,
          accountAddress: this._accountAddress,
        });
      }
      const nonce = await this._ERC721NonceContract.getNonce({
        contractAddress,
        accountAddress: this._accountAddress,
        tokenId,
      });

      const signature = this._createSha3Signature({
        contractAddress,
        amount: nftBillInfo.amount,
        currency: nftBillInfo.currency,
        tokenId,
        nonce,
      });

      const res = await this._GraphqlCustom.createOfferForEditorsMutation(
        {
          input: {
            signature,
            tokenId,
            type: "SALE",
            contractAddress,
            price: {
              amount: nftBillInfo.amount,
              currency: nftBillInfo.currency,
            },
            supply: 1,
          },
        },
        this._token
      );
      return res;
    } catch (err) {
      console.error("_approveNFTForERC721", err);
    }
  }

  private async _approveNFTForERC1155({
    tokenId,
    contractAddress,
    nftBillInfo,
  }: {
    tokenId: number;
    contractAddress: string;
    nftBillInfo: {
      supply: number;
      amount: number;
      currency: string;
    };
  }) {
    try {
      const isApproved = await this._ERC1155Contract.isApprovedForAll({
        accountAddress: this._accountAddress,
      });
      if (!isApproved) {
        await this._ERC1155Contract.setApprovalForAll({
          accountAddress: this._accountAddress,
        });
      }
      const nonce = await this._ERC1155NonceContract.getNonce({
        contractAddress,
        tokenId,
        accountAddress: this._accountAddress,
      });

      const signature = this._createSha3Signature({
        contractAddress,
        amount: nftBillInfo.amount,
        currency: nftBillInfo.currency,
        tokenId,
        nonce,
      });

      const res = await this._GraphqlCustom.createOfferForEditorsMutation(
        {
          input: {
            signature,
            tokenId,
            type: "SALE",
            contractAddress,
            price: {
              amount: nftBillInfo.amount,
              currency: nftBillInfo.currency,
            },
            supply: nftBillInfo.supply,
          },
        },
        this._token
      );
      return res;
    } catch (err) {
      console.error("_approveNFTForERC1155", err);
    }
  }

  private async _login({
    verificationToken,
    accountAddress,
  }: {
    verificationToken: number;
    accountAddress: string;
  }) {
    const messageHash = utils.hexlify(
      utils.toUtf8Bytes(
        `We ask you to sign this message to prove ownership of this account: ${this._accountAddress.toLowerCase()} (${verificationToken})`
      )
    );

    const signature = await this._createSignature({
      messageHash,
      accountAddress,
    });

    try {
      const res = await this._GraphqlCustom.loginMutation({
        data: {
          ethAddress: accountAddress,
          signature,
        },
      });
      return res;
    } catch (err) {
      console.error("_login", err);
    }
  }

  private async _verificationToken({
    accountAddress,
  }: {
    accountAddress: string;
  }) {
    try {
      const verificationToken: number =
        await this._GraphqlCustom.verificationTokenQuery({
          data: {
            ethAddress: accountAddress,
          },
        });

      const res = await this._login({
        verificationToken,
        accountAddress,
      });

      return res;
    } catch (err) {
      console.error("_verificationToken", err);
    }
  }

  private _createSha3Signature({
    contractAddress,
    tokenId,
    amount,
    currency,
    nonce,
  }: {
    contractAddress: string;
    tokenId: number;
    amount: number;
    currency: string;
    nonce: string;
  }) {
    switch (currency) {
      case USDT.code:
        amount = amount * 10 ** USDT.multiplier;
        break;
      case BNB.code:
        amount = amount * 10 ** BNB.multiplier;
        break;
      default:
        break;
    }

    try {
      return soliditySha3Raw(contractAddress, tokenId, amount, 1, nonce);
    } catch (err) {
      console.error("_createSha3Signature", err);
    }
  }

  private async _createSignature({
    messageHash,
    accountAddress,
  }: {
    messageHash: string;
    accountAddress: string;
  }) {
    try {
      let signature = "";
      if (this._privateKey) {
        signature = await this._web3.eth.sign(messageHash, accountAddress);
      } else {
        signature = await this._web3.eth.personal.sign(
          messageHash,
          accountAddress,
          accountAddress
        );
      }

      return signature;
    } catch (err) {
      console.error("_createSignature", err);
    }
  }

  private async _getToken() {
    if (!this._accountAddress) {
      try {
        const accounts = await this._web3.eth.getAccounts();
        this._accountAddress = accounts[0];
      } catch (err) {
        console.error("_getToken get account", err);
      }
    }

    if (this._accountAddress) {
      try {
        const token = await this._verificationToken({
          accountAddress: this._accountAddress,
        });
        this._token = token;
      } catch (err) {
        console.error("_getToken get token", err);
      }
    }
  }
}
