import { supabase } from '@/lib/supabase';

export interface GoogleUserInfo {
  email: string;
  photo?: string;
  name?: string;
}

export interface AppleUserInfo {
  email: string;
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
}

/**
 * Updates user profile with avatar URL from OAuth provider
 */
export const updateProfileWithAvatar = async (
  email: string,
  avatarUrl?: string,
  username?: string
) => {
  try {
    const updateData: any = { email };
    
    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }
    
    if (username) {
      updateData.username = username;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'email' });

    if (error) {
      console.error('Error updating profile with avatar:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { success: false, error };
  }
};

/**
 * Gets the current user's profile information
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user?.email) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', session.session.user.email)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to determine if a URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Check if it's from trusted domains
    const trustedDomains = [
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com'
    ];
    
    return trustedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};