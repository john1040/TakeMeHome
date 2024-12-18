import PostItem from "@/components/PostItem";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Stack } from "expo-router";

const PostDetails = () => {
    const { postId } = useLocalSearchParams();
    const { userProfile } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            
            const { data, error } = await supabase
                .from('post')
                .select(`
                    *,
                    profiles:user_id (username),
                    image:image (url)
                `)
                .eq('id', postId)
                .single();

            if (error) {
                console.error('Error fetching post:', error);
                setLoading(false);
                return;
            }

            setPost(data);
            setLoading(false);
        };

        fetchPost();
    }, [postId]);

    return (
        <>
            <Stack.Screen 
                options={{
                    headerBackTitle: "Back",
                    title: ""
                }}
            />
            {loading ? (
                <Text>Loading...</Text>
            ) : !post ? (
                <Text>Post not found</Text>
            ) : (
                <View>
                    <PostItem
                        post={post}
                        userId={userProfile?.id}
                        showDelete={true}
                        onDelete={() => console.log(`Deleting post with ID: ${postId}`)}
                    />
                </View>
            )}
        </>
    );
}

export default PostDetails;