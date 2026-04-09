import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { CONFIG } from "@/constants/config";

export const PRO_ENTITLEMENT = "pro";

export function configureRevenueCat(appUserId?: string): void {
  const apiKey =
    Platform.OS === "ios" ? CONFIG.REVENUECAT_IOS_KEY : CONFIG.REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey, appUserID: appUserId });
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

export async function isPro(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return hasProEntitlement(info);
}

export async function purchase(
  pkg: PurchasesPackage
): Promise<{ ok: true; info: CustomerInfo } | { ok: false; userCancelled: boolean; message: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, info: customerInfo };
  } catch (e) {
    const err = e as { userCancelled?: boolean; code?: string; message?: string };
    return {
      ok: false,
      userCancelled:
        err.userCancelled === true ||
        err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
      message: err.message ?? "Purchase failed",
    };
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
