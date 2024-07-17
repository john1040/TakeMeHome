import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import React from 'react';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Set up the auth state change listener
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        queryClient.setQueryData(['session'], session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  return { session, isLoading };
}