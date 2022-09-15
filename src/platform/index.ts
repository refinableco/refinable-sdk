import { LooksrarePlatform } from "./LooksrarePlatform";
import { X2Y2Platform } from "./X2Y2Platform";

export enum Platform {
  REFINABLE = "refinable",
  LOOKSRARE = "looksrare",
  OPENSEA = "opensea",
  X2Y2 = "x2y2",
}

export const platforms = {
  [Platform.LOOKSRARE]: LooksrarePlatform,
  [Platform.X2Y2]: X2Y2Platform,
};
