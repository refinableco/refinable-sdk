# refinable-sdk

`refinable-sdk` is a NPM package that can be added to the project to work with Refinable contracts.

## Get started

## TL;DR - Run the examples against testnet

We have created some examples inside of the [`examples`](./examples) directory. These illustrate the functionality of the SDK and are easily executable.

**How to run the 721 mint example**

1. `yarn install`
2. `PRIVATE_KEY=<your private key> API_KEY=<refinable api key> npx ts-node ./examples/mint/mint721.ts`

After executing this, you can view your nft at https://app-testnet.refinable.com/.

> These are just example scripts we wrote, the `PRIVATE_KEY` is only to initialize the ethers provider. We do not send or save your private key anywhere. Please view the example script for the details on this.

## How to configure everything

To get started, create an instance of the refinable sdk.

```ts
import { Refinable } from "@refinablecom/nft-sdk";

const refinable = await Refinable.create(wallet, "API_KEY", {
  // Optional options
});
```

Where there are some arguments
|Argument|Description|Values|
|---|---|---|
|wallet | The Provider that is allowed to call functions. | Ethers Signer |
|Api Key|The API key, obtained from Refinable|string|
|options|Options for customizing the SDK|RefinableOptions|

## Initialize wallet

To write scripts with our SDK, you'll need to initialize a wallet. When you're doing this from a user-facing platform like a browser. You do not need this as you'll be able to pass the provider injected by metamask.
For initializing the wallet you can rely on the added helper factories. When initializing your wallet, please select a chain you want to connect to. Currently the supported chains are `BscTestnet`, `BscMainnet`, `PolygonTestnet`, `PolygonMainnet`, `Ethereum`, `EthereumRinkeby`.

```ts
import { initializeWallet, Chain } from "@refinablecom/nft-sdk";

const wallet = initializeWallet(PRIVATE_KEY, Chain.BscTestnet);
const address = await wallet.getAddress();
```

## Methods

### Minting a new NFT

```ts
import { StandardRoyaltyStrategy, Chain } from "@refinablecom/nft-sdk";
import * as fs from "fs";
import * as path from "path";

// ...

// Upload the file
const fileStream = fs.createReadStream(path.join(__dirname, "./image.jpg"));

// We accept any type of filestream here, you can also just download it and pass that steam
const file = await refinable.uploadFile(fileStream);

// SDK: mint nft
const nft = await refinable
  .nftBuilder()
  .erc721({
    file,
    description: "some test description",
    name: "The Test NFT",
    royalty: new StandardRoyaltyStrategy([]),
    chainId: Chain.BscTestnet,
  })
  .createAndMint();
```

more detailed examples can be found in [the examples folder](./examples/mint)

### Listing for sale

```ts
import { TokenType, PriceCurrency, Chain } from "@refinablecom/nft-sdk";

// ...

// This is not needed if you just called the previous mint function
const nft = refinable.createNft({
  type: TokenType.Erc721,
  chainId: Chain.BscTestnet
  contractAddress: "<your NFTs contract address>",
  tokenId: "2",
  // optional, mostly for ERC1155
  supply: 1
});

// Put for sale
await nft.putForSale({
  amount: 1,
  currency: PriceCurrency.Bnb,
});
```

#### `putForSale(price: Price, supply?: number): Promise<SaleOffer>`

| Argument       | Description                                                                  | Values                                             |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| price.amount   | The price that you want to list the NFT for sale for                         | `number`                                           |
| price.currency | The currency you want to use                                                 | [View supported currencies](#supported-currencies) |
| supply         | _optional (erc1155)_ - Only when putting for sale multiple editions | `number`                                           |

### Cancelling sale

```ts
import { TokenType, Chain } from "@refinablecom/nft-sdk";

// ...

// Initialize the existing NFT you want to cancel for sale
const nft = refinable.createNft({
  type: TokenType.Erc721,
  chainId: Chain.BscTestnet
  contractAddress: "<your NFTs contract address>",
  tokenId: "2",
  // optional, mostly for ERC1155
  supply: 1
});

// Cancel sale
await nft.cancelSale();
```
#### `cancelSale(): Promise<TransactionResponse>`
No parameters

### Transfering an item

Transfering an item requires you to call the `transfer` method on the NFT object.

```ts
import { TokenType, Chain } from "@refinablecom/nft-sdk";

// ...

// Initialize the existing NFT you want to transfer
const nft = refinable.createNft({
  type: TokenType.Erc721,
  chainId: Chain.BscTestnet
  contractAddress: "<your NFTs contract address>",
  tokenId: "2",
  // optional, mostly for ERC1155
  supply: 1
});

// Example for 721
await nft.transfer("<Owner Wallet Address>", "<Recipient Wallet Address>");

// Example for ERC1155
await nft.transfer("<Owner Wallet Address>", "<Recipient Wallet Address>", 2);
```
#### `transfer(ownerEthAddress: string, recipientEthAddress: string): Promise<TransactionResponse>`
| Argument                 | Description                                                                    | Type   |
| ------------------------ | ------------------------------------------------------------------------------ | ------ |
| Owner Wallet Address     | The Wallet address that currently owns the NFT, 0x....                         | `string` |
| Recipient Wallet Address | The Recipient wallet address that should receive the NFT, 0x...                | `string` |
| Amount                   | _optional (erc1155)_ - The amount of editions of that nft you want to send | `number` |

### Burning an item

For burning an item you need to call `burn` method on NFT object.

```ts
import { TokenType, Chain } from "@refinablecom/nft-sdk";

// ...

// Initialize the existing NFT you want to transfer
const nft = refinable.createNft({
  type: TokenType.Erc721,
  chainId: Chain.BscTestnet
  contractAddress: "<your NFTs contract address>",
  tokenId: "2",
  // optional, mostly for ERC1155
  supply: 1
});

// Example for 721
await nft.burn();

// Example for ERC1155
await nft.burn("<Owner Wallet Address>", 2);
```
#### `burn(supply?: number, ownerEthAddress?: string): Promise<TransactionResponse>`

| Argument | Description                                         | Type   |
| -------- | --------------------------------------------------- | ------ |
| Supply   |  _optional (erc1155)_ - The amount of editions of that nft you want to burn | `number` |
| OwnerEthAddress   | _optional (erc1155)_ - The address of the user owning the token | `string` |

### Listing for Auction

```javascript
import { TokenType, PriceCurrency, Chain } from "@refinablecom/nft-sdk";

// ...

// Initialize the existing NFT you want to transfer
const nft = refinable.createNft({
  type: TokenType.Erc721,
  chainId: Chain.BscTestnet
  contractAddress: "<your NFTs contract address>",
  tokenId: "2",
  // optional, mostly for ERC1155
  supply: 1
});

// Put for auction
const response = await nft.putForAuction({
  auctionStartDate: new Date(Date.now() + 300000),
  auctionEndDate: new Date(Date.now() + 900000),
  price: {
    amount: 1,
    currency: PriceCurrency.Bnb,
  },
});
```

| Argument           | Description                                          | Values                                             |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------- |
| `auctionStartDate` | The date when the auction is supposed to start       | `Date`                                             |
| `auctionEndDate`   | The date when the auction is supposed to end         | `Date`                                             |
| `price.amount`           | The price that you want to list the NFT for sale for | `number`                                           |
| `price.currency`         | The currency you want to use                         | [View supported currencies](#supported-currencies) |

### Cancelling an Auction

Cancels an auction, without transfering the NFT.

[Example](./examples/cancelAuction.ts)

```ts
// Continuation from create auction ...

// Put for auction
const { offer } = await nft.putForAuction({
  auctionStartDate: new Date(Date.now() + 300000),
  auctionEndDate: new Date(Date.now() + 900000),
  price: {
    amount: 1,
    currency: PriceCurrency.Bnb,
  },
});

await offer.cancelAuction();
```

### Ending an auction

Ends an Auction where time has run out. Ending an auction will transfer the nft to the winning bid.

[Example](./examples/cancelAuction.ts)

```ts
// Continuation from create auction ...

// Put for auction
const { offer } = await nft.putForAuction({
  auctionStartDate: new Date(Date.now() + 300000),
  auctionEndDate: new Date(Date.now() + 900000),
  price: {
    amount: 1,
    currency: PriceCurrency.Bnb,
  },
});

await offer.endAuction();
```

### Fetching data
#### Getting items for sale

Get all items for-sale of a user

[Example](./examples/item/itemsOnSale.ts)

```javascript
await refinable.getItemsOnSale(<paging number> ,<after string>);
```

| Argument | Description                                 | Values                            |
| -------- | ------------------------------------------- | --------------------------------- |
| `paging` | Number of items you want to fetch at a time | `Number (default=30 & max=100 ) ` |
| `after`  | Cursor you want to fetch after (endCursor)  | `String (Optional)`               |

#### Getting items on auction

Get all items on auction of a user

[Example](./examples/item/itemsOnAuction.ts)

```javascript
await refinable.getItemsOnAuction(<paging number>, <after string>);
```

| Argument | Description                                 | Values                            |
| -------- | ------------------------------------------- | --------------------------------- |
| `paging` | Number of items you want to fetch at a time | `Number (default=30 & max=100 ) ` |
| `after`  | Cursor you want to fetch after (endCursor)  | `String (Optional)`               |

#### Getting owned items for a user

Get all owned items by a user

[Example](./examples/item/getOwnedItems.ts)

```typescript
await refinable.getOwnedItems(<paging>,<after>)
```

| Argument | Description                                 | Values                           |
| -------- | ------------------------------------------- | -------------------------------- |
| `paging` | Number of items you want to fetch at a time | `Number (default=30 & max=100) ` |
| `after`  | Cursor you want to fetch after (endCursor)  | `String (Optional) `             |

#### Getting created items by a user

Get all items created by a user

[Example](./examples/item/getCreatedItems.ts)

```typescript
await refinable.getCreatedItems(<paging>,<after>)

```

| Argument | Description                                 | Values                           |
| -------- | ------------------------------------------- | -------------------------------- |
| `paging` | Number of items you want to fetch at a time | `Number (default=30 & max=100) ` |
| `after`  | Cursor you want to fetch after (endCursor)  | `String (Optional) `             |

## Supported Networks

Refinable currently supports the following networks:

- `56`: Binance Smart Chain (BSC) Mainnet
- `97`: Binance Smart Chain (BSC) Testnet
- `137`: Polygon Mainnet
- `80001`: Polygon Mumbai Testnet
- `1`: Ethereum
- `4`: Ethereum Rinkeby Testnet

## Supported currencies

| Network         | Currencies            |
| --------------- | --------------------- |
| BscMainnet      | BNB, USDT, BUSD       |
| BscTestnet      | BNB, USDT, BUSD       |
| PolygonMainnet  | MATIC, USDT, WETH     |
| PolygonTestnet  | MATIC                 |
| Ethereum        | ETH, USDT, WETH, USDC |
| EthereumRinkeby | ETH, USDT, WETH, USDC |

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
