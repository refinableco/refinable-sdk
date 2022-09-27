import { BigNumber, ethers } from "ethers";
import { Refinable } from "../../src";
import EvmAccount from "../../src/refinable/account/EvmAccount";
import { getMockRefinableClient } from "../helpers/client";

describe("Account", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("EVMAccount", () => {
    let refinable: Refinable;
    const ETH_ADDRESS = "0x898de23b24C7C2189488079a6871C711Dd125504";

    beforeAll(async () => {
      refinable = getMockRefinableClient(ETH_ADDRESS);
    });

    describe("getBalance", () => {
      it("Should return correct balance for ETH", async () => {
        jest
          .spyOn(refinable.evm.signer as ethers.Signer, "getBalance")
          .mockResolvedValue(BigNumber.from("1000000000000000000"));

        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getBalance()).toBe("1.0");
      });

      it("Should return correctly return zero balance", async () => {
        jest
          .spyOn(refinable.evm.signer as ethers.Signer, "getBalance")
          .mockResolvedValue(BigNumber.from("0000000000000000000"));

        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getBalance()).toBe("0.0");
      });
    });

    describe("getTokenDecimals", () => {
      it("Should use default decimals if no address passed", async () => {
        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getTokenDecimals(null)).toBe(18);
      });

      it("Should use default decimals if incorrect address", async () => {
        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getTokenDecimals("sss")).toBe(18);
      });

      it("Should return correct decimals from contract", async () => {
        jest.spyOn(ethers, "Contract").mockImplementation(
          jest.fn().mockImplementation(() => {
            return { decimals: jest.fn().mockResolvedValue(9) };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getTokenDecimals(ETH_ADDRESS)).toBe(9);
      });
    });

    describe("getTokenBalance", () => {
      it("Should return null when tokenAddress not set", async () => {
        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getTokenBalance(null)).toBe(null);
      });

      it("Should return null when fetching balance fails", async () => {
        const account = new EvmAccount(refinable.provider, {});

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe(null);
      });

      it("Should return and correctly format zero balance using 18 decimals", async () => {
        jest.spyOn(ethers, "Contract").mockImplementationOnce(
          jest.fn().mockImplementation(() => {
            return {
              balanceOf: jest
                .fn()
                .mockResolvedValue(BigNumber.from("0000000000000000000")),
            };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        jest.spyOn(account, "getTokenDecimals").mockResolvedValueOnce(18);

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe("0");
      });

      it("Should return and correctly format zero balance using 0 decimals", async () => {
        jest.spyOn(ethers, "Contract").mockImplementationOnce(
          jest.fn().mockImplementation(() => {
            return {
              balanceOf: jest
                .fn()
                .mockResolvedValue(BigNumber.from("10000000000000000000")),
            };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        jest.spyOn(account, "getTokenDecimals").mockResolvedValueOnce(0);

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe(
          "10000000000000000000"
        );
      });

      it("Should return and correctly format balance using 18 decimals", async () => {
        jest.spyOn(ethers, "Contract").mockImplementation(
          jest.fn().mockImplementation(() => {
            return {
              balanceOf: jest
                .fn()
                .mockResolvedValue(BigNumber.from("1000000000000000000")),
            };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        jest.spyOn(account, "getTokenDecimals").mockResolvedValueOnce(18);

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe("1");
      });

      it("Should return and correctly format balance using 18 decimals, with some decimals", async () => {
        jest.spyOn(ethers, "Contract").mockImplementation(
          jest.fn().mockImplementation(() => {
            return {
              balanceOf: jest
                .fn()
                .mockResolvedValue(BigNumber.from("1100000000000000000")),
            };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        jest.spyOn(account, "getTokenDecimals").mockResolvedValueOnce(18);

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe("1.1");
      });

      it("Should return and correctly format balance using 9 decimals", async () => {
        jest.spyOn(ethers, "Contract").mockImplementation(
          jest.fn().mockImplementation(() => {
            return {
              balanceOf: jest
                .fn()
                .mockResolvedValue(BigNumber.from("22000000000")),
            };
          })
        );

        const account = new EvmAccount(refinable.provider, {});

        jest.spyOn(account, "getTokenDecimals").mockResolvedValueOnce(9);

        expect(await account.getTokenBalance(ETH_ADDRESS)).toBe("22");
      });
    });
  });
});
