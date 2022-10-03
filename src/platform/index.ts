import { Platform } from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import { AbstractPlatform } from "./AbstractPlatform";
import { LooksrarePlatform } from "./LooksrarePlatform";
import { OpenseaPlatform } from "./OpenseaPlatform";
import { X2Y2Platform } from "./X2Y2Platform";

export const platforms = {
  [Platform.Looksrare]: LooksrarePlatform,
  [Platform.X2Y2]: X2Y2Platform,
  [Platform.Opensea]: OpenseaPlatform,
};

export class PlatformFactory {
  constructor(private readonly refinable: Refinable) {}

  createPlatform(platform: Platform, chainId: 1 | 5): AbstractPlatform {
    switch (platform) {
      case Platform.Looksrare:
        return new LooksrarePlatform(this.refinable);
      case Platform.X2Y2:
        return new X2Y2Platform(this.refinable);
      case Platform.Opensea:
        return new OpenseaPlatform(this.refinable, chainId);
      default:
        throw new Error("Platform not supported");
    }
  }
}
