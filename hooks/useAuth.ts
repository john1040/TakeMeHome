import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery<{
    session: Session | null;
    profile: any | null;
  }>({
    queryKey: ['sessionAndProfile'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (session?.user?.id) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('username, id')
          .eq('email', session.user.email);

        if (error) throw error;

        let profile = null;
        if (profiles && profiles.length > 0) {
          profile = profiles[0];  // Take the first profile if multiple exist
        } else {
          // Handle case where no profile exists
          console.warn('No profile found for user');
          // Optionally, you could create a profile here
          // const { data: newProfile, error: createError } = await supabase
          //   .from('profiles')
          //   .insert({ email: session.user.email })
          //   .single();
          // if (createError) throw createError;
          // profile = newProfile;
        }

        return { session, profile };
      }

      return { session: null, profile: null };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { 
    session: sessionData?.session,
    userProfile: sessionData?.profile,
    isLoading: sessionLoading,
    error: sessionError,
  };
}