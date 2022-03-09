import { SaleVersion } from "./interfaces/SaleInfo";

export class ERCSaleID {
  constructor(
    public readonly saleId: string,
    public readonly version: SaleVersion
  ) {}

  static fromBlockchainId(blockchainId: string) {
    if (!blockchainId || typeof blockchainId !== "string") return null;

    const [version, saleId] = blockchainId.split(":");

    return new ERCSaleID(saleId, Number(version));
  }

  toBlockchainId() {
    return `${this.version}:${this.saleId}`;
  }
}
