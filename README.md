# refinable-sdk

`refinable-sdk` is a NPM package that can be added to the project to work with Refinable contracts.

The way to work with this SDK is extremely simple as you just need to initialize and use the methods that we have built.

```javascript
//import detectEthereumProvider from "@metamask/detect-provider";

const token = localStorage.getItem("token") || "";
const provider: any = await detectEthereumProvider();
const refinable = new Refinable(
  provider,
  Network.BSCTest,
  {
    address: "",
    privateKey: "",
  },
  token
);
```

- Token is the token that authenticates to the API.
- Provider is the provider you want to initialize (I am using the metamask here).
- Network: you can choose BSCTest for testnet and BSC for mainnet

Or here is another way in case you use with private key.

```javascript
const provider = new Web3.providers.HttpProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545/"
);

const refinable = new Refinable(provider, Network.BSCTest, {
  address: ACCOUNT_ADDRESS,
  privateKey: PRIVATE_KEY,
});
```

By initializing an instant like above, you will already be able to use our method.
This is a method that we have developed allowing you to approve ERC721 and ERC1155 tokens. You just need to fill in the parameter and it will do the rest which is approving the token for you.

```javascript
refinable.approveNFT({
  tokenId: nft.node.tokenId,
  contractAddress: nft.node.contractAddress,
  nftBillInfo: {
    supply: Number(nft.supply),
    amount: Number(nft.price),
    currency: nft.currency,
  },
});
```

To run the test you need to configure your own `.env` file then run `yarn test`

```javascript
ACCOUNT_ADDRESS: // Your wallet address
PRIVATE_KEY: // Your private key
UNKNOWN_TOKEN: // TokenId that does not exist
AVAILABLE_TOKEN_1155: // Invalid tokenId eg -1
SAMPLE_TOKEN_721: // TokenId of some ERC721 in your wallet
SAMPLE_TOKEN_1155: // TokenId of some ERC1155 in your wallet
```

We have this key in env.example
