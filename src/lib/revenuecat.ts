import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

export function configureRevenueCat(appUserId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY,
    appUserID: appUserId,
  });
}

export async function isPro(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return typeof info.entitlements.active['pro'] !== 'undefined';
}
