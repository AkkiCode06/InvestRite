import { createContext, useContext, useState } from 'react';
import { setMoneyLocale } from '../utils/format.js';

/* Global market region: 'US' (NYSE/NASDAQ, $) or 'IN' (NSE/BSE, ₹).
   Persisted to localStorage; drives data universes + currency formatting. */

const RegionCtx = createContext({ region: 'US', setRegion: () => {} });
const KEY = 'ir_region';

function initialRegion() {
  try {
    const r = localStorage.getItem(KEY);
    if (r === 'IN' || r === 'US') return r;
  } catch { /* ignore */ }
  return 'US';
}

export function RegionProvider({ children }) {
  const [region, setRegionState] = useState(initialRegion);

  // Keep currency formatting in sync on every render (cheap + idempotent).
  setMoneyLocale(region);

  const setRegion = (r) => {
    const v = r === 'IN' ? 'IN' : 'US';
    try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
    setMoneyLocale(v);
    setRegionState(v);
  };

  return <RegionCtx.Provider value={{ region, setRegion }}>{children}</RegionCtx.Provider>;
}

export function useRegion() {
  return useContext(RegionCtx);
}
