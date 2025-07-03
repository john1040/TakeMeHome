import PostItem from "@/components/PostItem";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { palette } from "@/constants/Colors";

const PostDetails = () => {
    const { postId } = useLocalSearchParams();
    const { userProfile } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPost = async () => {
        if (!postId) return;
        
        const { data, error } = await supabase
            .from('post')
            .select(`
                *,
                profiles:user_id (username, avatar_url),
                image:image (url)
            `)
            .eq('id', postId)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            setLoading(false);
            return;
        }

        // Transform data to match PostItem expectations
        const transformedPost = {
            ...data,
            username: data.profiles?.username || 'Anonymous',
            avatar_url: data.profiles?.avatar_url,
            street_name: data.street_name || '',
        };

        setPost(transformedPost);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPost();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchPost();
    }, [postId]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerBackTitle: "Back",
                    title: post?.title || "Post Details"
                }}
            />
            {loading ? (
                <ThemedView style={styles.loadingContainer}>
                    <ThemedText>Loading...</ThemedText>
                </ThemedView>
            ) : !post ? (
                <ThemedView style={styles.errorContainer}>
                    <ThemedText>Post not found</ThemedText>
                </ThemedView>
            ) : (
                <ScrollView
                    style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <PostItem
                        post={post}
                        userId={userProfile?.id}
                        showDelete={userProfile?.id === post.user_id}
                        onDelete={() => console.log(`Deleting post with ID: ${postId}`)}
                    />
                </ScrollView>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default PostDetails;