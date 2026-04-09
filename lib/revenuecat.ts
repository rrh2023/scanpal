import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { CONFIG } from "@/constants/config";

export function configureRevenueCat(appUserId?: string): void {
  const apiKey =
    Platform.OS === "ios" ? CONFIG.REVENUECAT_IOS_KEY : CONFIG.REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey, appUserID: appUserId });
}

export async function isPro(): Promise<boolean> {
  const info: CustomerInfo = await Purchases.getCustomerInfo();
  return info.entitlements.active["pro"] !== undefined;
}
