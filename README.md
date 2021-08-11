# refinable-sdk

`refinable-sdk` is a NPM package that can be added to the project to work with Refinable contracts.

## Get started

To get started, create an instance of the refinable sdk.

```javascript
const refinable = Refinable.create(wallet, address, "API_KEY");
```

Where there are some arguments
|Argument|Description|Values|
|---|---|---|
|wallet | The Provider that is allowed to call functions. | Ethers Signer |
|address|The Wallet address|string|
|Api Key|The API key, obtained from Refinable|string|

For creating the wallet you can rely on the added helper factories

```javascript
const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);
const address = await wallet.getAddress();
```

where `REFINABLE_NETWORK` can be any value of the enum and represents the supported network

## Methods

### Listing for sale

```javascript
await refinable.putForSale({
  type: TOKEN_TYPE.ERC721,
  contractAddress: erc721TokenAddress,
  tokenId: tokenId,
  amount: amount,
  supply: 1,
  currency: REFINABLE_CURRENCY.BNB,
});
```

| Argument         | Description                                                                                               | Values                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type             | Whether it's an 721 or 1155 standard NFT                                                                  | `TOKEN_TYPE.ERC721`, `TOKEN_TYPE.ERC1155`                                                                                                                                 |
| Contract Address | Which Contract address the item is located under                                                          | the type is a contract address `string`, You can use `erc721TokenAddress` or `erc1155TokenAddress`. ex. `import { erc721TokenAddress } from "@refinableco/refinable-sdk"` |
| tokenId          | The token ID of the NFT                                                                                   | the type is a `number`                                                                                                                                                    |
| amount           | The price that you want to list the NFT for sale for                                                      | `number`                                                                                                                                                                  |
| supply           | For ERC721 this is `1`, for ERC1155 NFTs this is the amount of items you want to put for sale of that nft | `number`                                                                                                                                                                  |
| currency         | The currency you want to use                                                                              | `USDT`, `BNB`                                                                                                                                                             |

### Cancelling sale

Want to unlist an item from sale?

```javascript
await refinable.cancelSale({
  type: TOKEN_TYPE.ERC721,
  contractAddress: erc721TokenAddress,
  tokenId: tokenId,
});
```

## Supported Networks

Refinable currently supports the following networks:

- Binance Smart Chain (BSC)
- Polygon

## Requesting an API Key

In order to obtain an API key, please email us at `sdk@refinable.com` and use the following template:

|                      |                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Project Name         | The name of your project                                                                                                            |
| User address         | The public wallet address that the API key will be attached to, This user should have connected to the Refinable site at least once |
| Est. Calls per month | The amount of estimated calls per month                                                                                             |
| Description          | Tell us a bit more about your project, why do you have to use an SDK?                                                               |

## Jobs

Interested in joining us? We're always on the lookout for good talent. Feel free to send us your most up-to-date resume at careers@refinable.com
