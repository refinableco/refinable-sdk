import { Platform } from "../@types/graphql";
import { LooksrarePlatform } from "./LooksrarePlatform";
import { X2Y2Platform } from "./X2Y2Platform"

export const platforms = {
  [Platform.Looksrare]: LooksrarePlatform,
  [Platform.X2Y2]: X2Y2Platform,
};
