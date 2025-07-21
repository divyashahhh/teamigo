import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export function useMemberFeed(table: 'announcements' | 'merchandise' | 'events', hostIds: string[]) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostIds || hostIds.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let column = 'host_id';
    if (table === 'events') column = 'user_id';
    supabase
      .from(table)
      .select('*')
      .in(column, hostIds)
      .order(table === 'events' ? 'date' : 'created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setData([]);
        } else {
          setData(data || []);
        }
        setLoading(false);
      });
  }, [table, hostIds]);

  return { data, loading, error };
} 