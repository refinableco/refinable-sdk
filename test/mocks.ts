import Web3 from "web3";

const INVALID_TOKEN = -1;
const ANOTHER_ADDRESS = "0x0000000000000000000000000000000000000000";

const AVAILABLE_TOKEN_1155 = Number(process.env.AVAILABLE_TOKEN_1155!);
const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS!;
const SAMPLE_TOKEN_721 = Number(process.env.SAMPLE_TOKEN_721!);
const SAMPLE_TOKEN_1155 = Number(process.env.SAMPLE_TOKEN_1155!);
const UNKNOWN_TOKEN = Number(process.env.UNKNOWN_TOKEN!);

const provider = new Web3.providers.HttpProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545/"
);

const web3 = new Web3(provider);
web3.eth.accounts.wallet.add({
  address: process.env.ACCOUNT_ADDRESS!,
  privateKey: process.env.PRIVATE_KEY!,
});

export {
  web3,
  provider,
  AVAILABLE_TOKEN_1155,
  ACCOUNT_ADDRESS,
  ANOTHER_ADDRESS,
  SAMPLE_TOKEN_721,
  SAMPLE_TOKEN_1155,
  INVALID_TOKEN,
  UNKNOWN_TOKEN,
};
