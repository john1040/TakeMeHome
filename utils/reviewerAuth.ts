import { supabase } from '@/lib/supabase';

export const REVIEWER_CREDENTIALS = {
  email: 'appstore.reviewer@takemehome.app',
  password: 'TMH-Review-2024!',
  username: 'AppStoreReviewer',
  phone: '+1-555-REVIEW',
};

export const isReviewerAccount = (email: string): boolean => {
  return email === REVIEWER_CREDENTIALS.email;
};

export const createReviewerProfile = async () => {
  try {
    // Create the auth user with automatic profile creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: REVIEWER_CREDENTIALS.email,
      password: REVIEWER_CREDENTIALS.password,
    });

    if (authError) {
      console.error('Error creating reviewer auth account:', authError);
      return { success: false, error: authError };
    }

    if (!authData.user) {
      return { success: false, error: new Error('No user created') };
    }

    // Wait a moment for the auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sign in as the newly created user to get proper session context
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: REVIEWER_CREDENTIALS.email,
      password: REVIEWER_CREDENTIALS.password,
    });

    if (signInError) {
      console.error('Error signing in after creation:', signInError);
      return { success: false, error: signInError };
    }

    // Now create the profile with the authenticated user context
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: REVIEWER_CREDENTIALS.email,
        username: REVIEWER_CREDENTIALS.username,
        phone: REVIEWER_CREDENTIALS.phone,
        phone_verified: true, // Skip phone verification for reviewer
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating reviewer profile:', profileError);
      return { success: false, error: profileError };
    }

    // Create some sample posts for the reviewer account
    await createSamplePosts(authData.user.id);

    return { success: true, data: { auth: signInData, profile: profileData } };
  } catch (error) {
    console.error('Unexpected error creating reviewer account:', error);
    return { success: false, error };
  }
};

const createSamplePosts = async (userId: string) => {
  const samplePosts = [
    {
      user_id: userId,
      title: 'Sample Lost Item - Keys',
      description: 'Lost my house keys near Central Park. They have a blue keychain with a small dog tag.',
      category: 'lost',
      street_name: 'Central Park West',
      geolocation: 'POINT(-73.9654 40.7829)', // Central Park coordinates
      availability_status: 'available',
    },
    {
      user_id: userId,
      title: 'Found Wallet',
      description: 'Found a brown leather wallet near the subway station. Contains some cards but no cash.',
      category: 'found',
      street_name: '42nd Street',
      geolocation: 'POINT(-73.9857 40.7484)', // Times Square coordinates
      availability_status: 'available',
    },
    {
      user_id: userId,
      title: 'Lost Phone - iPhone',
      description: 'Lost my iPhone 14 Pro in a black case. Last seen at the coffee shop on Broadway.',
      category: 'lost',
      street_name: 'Broadway',
      geolocation: 'POINT(-73.9876 40.7589)', // Broadway coordinates
      availability_status: 'taken', // This one is marked as taken for testing
    },
  ];

  try {
    const { error } = await supabase
      .from('posts')
      .insert(samplePosts);

    if (error) {
      console.error('Error creating sample posts for reviewer:', error);
    } else {
      console.log('Sample posts created successfully for reviewer account');
    }
  } catch (error) {
    console.error('Unexpected error creating sample posts:', error);
  }
};

export const signInReviewer = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: REVIEWER_CREDENTIALS.email,
      password: REVIEWER_CREDENTIALS.password,
    });

    if (error) {
      // If sign in fails, the account might not exist, try to create it
      if (error.message.includes('Invalid login credentials')) {
        console.log('Reviewer account not found, creating it...');
        const createResult = await createReviewerProfile();
        if (!createResult.success) {
          return { success: false, error: createResult.error };
        }
        
        // Try signing in again after account creation
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: REVIEWER_CREDENTIALS.email,
          password: REVIEWER_CREDENTIALS.password,
        });

        if (retryError) {
          return { success: false, error: retryError };
        }

        return { success: true, data: retryData };
      }
      
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};