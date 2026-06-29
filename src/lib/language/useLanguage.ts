import { useEffect, useState } from 'react';
import { getStats, type LanguageStats } from './srs';
import { getProfile, type LanguageProfile } from './profile';

/** Re-run `compute` whenever language state changes (SRS or profile writes). */
function useLanguageValue<T>(compute: () => T): T {
  const [value, setValue] = useState(compute);
  useEffect(() => {
    const update = () => setValue(compute());
    update();
    window.addEventListener('origin:lang', update);
    return () => window.removeEventListener('origin:lang', update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function useLanguageStats(langSlug: string): LanguageStats {
  return useLanguageValue(() => getStats(langSlug));
}

export function useLanguageProfile(langSlug: string): LanguageProfile {
  return useLanguageValue(() => getProfile(langSlug));
}
