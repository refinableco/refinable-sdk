# refinable-sdk

`refinable-sdk` is a NPM package that can be added to the project to work with Refinable contracts.

## Get started

## TL;DR - Start on Testnet

1. `yarn install`
2. `NODE_ENV npx esno src/examples/mint/mint721.ts`

view your nft at http://app-testnet.refinable.com/

## How to configure everything

To get started, create an instance of the refinable sdk.

```javascript
const refinable = await Refinable.create(wallet, address, "API_KEY");
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

To get started, make an nft `object` using the factory

```javascript
const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
  chainId: 56,
  contractAddress: erc721TokenAddress,
  tokenId: parameters[1],
});
```

where `tokenId` is _optional_ in case you want to mint a new one.

## Methods

### Minting a new NFT

```javascript
const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
  chainId: 97,
  contractAddress,
});

// SDK: mint nft
await nft.mint(
  {
    file: fileStream,
    description: "some test description",
    name: "The Test NFT",
  },
  new StandardRoyaltyStrategy([])
);
```

more detailed examples can be found in [the examples folder](./src/examples/mint)

### Listing for sale

```javascript
const nft = await refinable.createNft(TOKEN_TYPE.ERC1155, {
  chainId: 97,
  contractAddress: erc721TokenAddress,
  tokenId: parameters[1],
});

await nft.putForSale({
  amount: amount,
  supply: 1,
  currency: PriceCurrency.BNB,
});
```

| Argument         | Description                                                                                                      | Values                                                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type             | Whether it's an 721 or 1155 standard NFT                                                                         | `TOKEN_TYPE.ERC721`, `TOKEN_TYPE.ERC1155`                                                                                                                                 |
| Contract Address | Which Contract address the item is located under                                                                 | the type is a contract address `string`, You can use `erc721TokenAddress` or `erc1155TokenAddress`. ex. `import { erc721TokenAddress } from "@refinableco/refinable-sdk"` |
| tokenId          | The token ID of the NFT                                                                                          | the type is a `number`                                                                                                                                                    |
| amount           | The price that you want to list the NFT for sale for                                                             | `number`                                                                                                                                                                  |
| supply           | For ERC721 this is not needed, for ERC1155 NFTs this is the amount of items you want to put for sale of that nft | `number`                                                                                                                                                                  |
| currency         | The currency you want to use                                                                                     | `USDT`, `BNB`                                                                                                                                                             |

### Cancelling sale

Want to unlist an item from sale?

Construct the item you have for sale and cancel its sale.

```javascript
const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
  chainId: 97,
  contractAddress: erc721TokenAddress,
  tokenId: parameters[1],
});
await nft.cancelSale();
```

### Transfering an item

Transfering an item requires you to call the `transfer` method on the NFT object.

**For 721 NFTs**:
```javascript
await nft.transfer(<Owner Wallet Address>, <Recipient Wallet Address>);
```

|Argument|Description|Type|
|---|---|---|
|Owner Wallet Address|The Wallet address that currently owns the NFT, 0x....|string|
|Recipient Wallet Address|The Recipient wallet address that should receive the NFT, 0x...|string|

**For 1155 Items**:
```javascript
await nft.transfer(<Owner Wallet Address>, <Recipient Wallet Address>, <Amount>);
```
|Argument|Description|Type|
|---|---|---|
|Owner Wallet Address|The Wallet address that currently owns the NFT, 0x....|string|
|Recipient Wallet Address|The Recipient wallet address that should receive the NFT, 0x...|string|
|Amount|The amount of editions of that nft you want to send|number|

## Supported Networks

Refinable currently supports the following networks:

- `56`: Binance Smart Chain (BSC) Mainnet
- `137`: Polygon Mainnet

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
