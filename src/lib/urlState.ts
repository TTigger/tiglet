import { useCallback, useEffect, useState } from 'react';

export function readParam(search: string, key: string): string | null {
  return new URLSearchParams(search).get(key);
}

export function writeParam(search: string, key: string, value: string): string {
  const params = new URLSearchParams(search);
  if (value) params.set(key, value);
  else params.delete(key);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useUrlState(key: string, initial = ''): [string, (v: string) => void] {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const fromUrl = readParam(window.location.search, key);
    if (fromUrl !== null) setValue(fromUrl);
  }, [key]);

  const update = useCallback((v: string) => {
    setValue(v);
    const search = writeParam(window.location.search, key, v);
    window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }, [key]);

  return [value, update];
}
