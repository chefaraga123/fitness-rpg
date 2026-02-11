import { useEffect, useRef, useState } from 'react';
import { fetchSupplements } from '../lib/fetchSupplements';
import type { DailyLog } from '../types';

export function useSupplements(initialized: boolean): DailyLog[] {
  const [supplements, setSupplements] = useState<DailyLog[]>([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!initialized || hasFetched.current) return;
    hasFetched.current = true;

    fetchSupplements().then(setSupplements);
  }, [initialized]);

  return supplements;
}
