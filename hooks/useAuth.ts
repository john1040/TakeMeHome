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
          .select('username, id, email, avatar_url')
          .eq('email', session.user.email);

        if (error) throw error;

        let profile = null;
        if (profiles && profiles.length > 0) {
          profile = profiles[0];  // Take the first profile if multiple exist
        } else {
          // Handle case where no profile exists - create a basic profile object
          console.warn('No profile found for user, using session data');
          profile = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null
          };
        }

        // Ensure we have email from session if not in profile
        if (profile && !profile.email) {
          profile.email = session.user.email;
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