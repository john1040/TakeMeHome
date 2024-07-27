import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, id')
        .eq('email', session.user.email)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // ... rest of the hook (signOut, etc.)

  return { 
    session, 
    userProfile, 
    isLoading: sessionLoading || profileLoading,
    // ... other returned values
  };
}