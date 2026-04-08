import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Product identifiers configured in the RevenueCat dashboard.
// Create these in App Store Connect / Google Play, then attach them to an
// Offering in RevenueCat with the package identifiers below.
export const PRODUCTS = {
  monthly: 'monthly_pro', // $4.99 / month
  annual: 'annual_pro', // $39 / year
} as const;

// Entitlement identifier configured in RevenueCat. A single "pro" entitlement
// is attached to both products above.
export const PRO_ENTITLEMENT = 'pro';

const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

let configured = false;

export function configureRevenueCat(appUserId?: string) {
  if (configured) return;
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY,
    appUserID: appUserId,
  });
  configured = true;
}

export function hasProEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined';
}

export async function isPro(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return hasProEntitlement(info);
}

export async function getOfferingPackages(): Promise<{
  monthly?: PurchasesPackage;
  annual?: PurchasesPackage;
}> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return {};
  return {
    monthly: current.monthly ?? undefined,
    annual: current.annual ?? undefined,
  };
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return hasProEntitlement(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return hasProEntitlement(info);
}
