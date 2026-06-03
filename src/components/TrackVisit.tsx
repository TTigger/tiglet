import { useEffect } from 'react';
import { pushRecent } from '../lib/storage';

export default function TrackVisit({ id }: { id: string }) {
  useEffect(() => { pushRecent(id); }, [id]);
  return null;
}
