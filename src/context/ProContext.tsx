import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import {
  configureRevenueCat,
  hasProEntitlement,
} from '../lib/revenuecat';

type ProContextValue = {
  isPro: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProContext = createContext<ProContextValue>({
  isPro: false,
  loading: true,
  refresh: async () => {},
});

export function ProProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await Purchases.getCustomerInfo();
    setInfo(current);
  }, []);

  useEffect(() => {
    configureRevenueCat();
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();

    const listener = (updated: CustomerInfo) => setInfo(updated);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [refresh]);

  const value = useMemo<ProContextValue>(
    () => ({ isPro: hasProEntitlement(info), loading, refresh }),
    [info, loading, refresh]
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  return useContext(ProContext);
}
