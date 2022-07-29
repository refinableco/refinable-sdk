import type {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import EvmTransaction from "../../src/transaction/EvmTransaction";

export const getEvmTxReceipt = (
  override?: Partial<TransactionReceipt>
): TransactionReceipt => ({
  to: "0xffA18fb5a09A6107A66daf71BBaa743B4FCf2168",
  from: "0xa508dD875f10C33C52a8abb20E16fc68E981F186",
  contractAddress: null,
  transactionIndex: 0,
  gasUsed: { type: "BigNumber", hex: "0x02d310" } as any,
  logsBloom:
    "0x00000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000080002000000000001000000100200000000000000000000000010008000000000000000000000008000010000000000000000000020000200000010000000800000000000000020000004010000000000000000000000000000000000000000000000040000000000000000000004000020000000000000000000000000000000000000000000001000000000400000000000002000000000080000040000000000000000000000000400000000020001010000000000000000000000000000000000100000000000000000000000000",
  blockHash:
    "0x55bd80d8b64ad6938202e99c9d5fcb8e657be7fe12f7d62ffd192b92468e8780",
  transactionHash:
    "0xb593086c892086b10a6e6978fe36a76fa056514a6ba1ea47417966c81467a3c1",
  logs: [],
  blockNumber: 5522285,
  confirmations: 1,
  cumulativeGasUsed: { type: "BigNumber", hex: "0x02d310" } as any,
  effectiveGasPrice: { type: "BigNumber", hex: "0x02d310" } as any,
  status: 1,
  type: 0,
  byzantium: true,
  ...override,
});

export const ETH_TX_RESPONSE: TransactionResponse = {
  nonce: 230,
  gasPrice: { type: "BigNumber", hex: "0x04a817c800" } as any,
  gasLimit: { type: "BigNumber", hex: "0x02ee4a" } as any,
  to: "0x898de23b24C7C2189488079a6871C711Dd125504",
  value: { type: "BigNumber", hex: "0x00" } as any,
  data: "0xb7f9cfe70000000000000000000000007da893faf70ce5f4ceef42a6e526ae62b3dc02f50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000061ebb8bc0000000000000000000000000000000000000000000000000000000061ebb9e8",
  chainId: 1337,
  v: 2709,
  r: "0xefcac37c693d50d75ff1a780e500ac349ef5cd228ad144f5edb66d7650115e42",
  s: "0x4ecdaf1489f6a3efb619928d01b6f1c08757f20ba1c019507798690f4671e9b5",
  from: "0xa508dD875f10C33C52a8abb20E16fc68E981F186",
  hash: "0xe98c9c5893142fe1ff09eded1ef49f4170180e311ba985cd138ca4c08a389e9a",
  type: null,
  confirmations: 0,
  wait: jest.fn(),
};

describe("Transaction", () => {
  describe("EvmTransaction", () => {
    it("Should return success false when tx did not pass", async () => {
      const tx = new EvmTransaction(getEvmTxReceipt({ status: 0 }));

      await tx.wait(1);

      expect(tx.success).toBe(false);
    });
    it("Should return success when tx passed", async () => {
      const tx = new EvmTransaction(getEvmTxReceipt({ status: 1 }));

      await tx.wait(1);

      expect(tx.success).toBe(true);
    });
  });
});
