import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export function useMemberSubscriptions() {
  const [hostIds, setHostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not found');
        setHostIds([]);
        setLoading(false);
        return;
      }
      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('host_id')
        .eq('member_id', user.id);
      if (subError) {
        setError(subError.message);
        setHostIds([]);
      } else {
        setHostIds(data.map((row: any) => row.host_id));
      }
      setLoading(false);
    };
    fetchSubscriptions();
  }, []);

  return { hostIds, loading, error };
} 