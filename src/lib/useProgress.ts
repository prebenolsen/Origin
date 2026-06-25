import { useEffect, useState } from 'react';
import { completion } from './progress';

/** Reactive completion fraction for a module path (re-reads on updates). */
export function useCompletion(path: string): number {
  const [value, setValue] = useState(() => completion(path));
  useEffect(() => {
    const update = () => setValue(completion(path));
    update();
    window.addEventListener('origin:progress', update);
    return () => window.removeEventListener('origin:progress', update);
  }, [path]);
  return value;
}
