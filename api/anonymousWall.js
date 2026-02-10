import express from "express";
import { createClient } from "@supabase/supabase-js";
// Note: Keeping mentions as a dynamic thing or relative import if possible.
// Since mentionUtils is .ts, we might need to handle this carefully.
// However, the original code had require('../utils/mentionUtils').
// To stay in ESM, we'll try to import it, but this might require a different approach if not compiled.
// For now, let's keep it as is but use import.
const router = express.Router();

// Initialize single Supabase client instance
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables in API");
  console.error(
    "Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get all posts with enhanced features (stored as columns)
router.get("/posts", async (req, res) => {
  try {
    const { userAlias, sortBy = "recent", categoryId, searchQuery } = req.query;

    let query = supabase
      .from("anonymous_posts")
      .select("*")
      // Don't show expired posts
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());

    // Apply filters
    if (categoryId) {
      // Filter posts that contain the category in their categories array
      query = query.contains("categories", [categoryId]);
    }

    if (searchQuery) {
      query = query.ilike("content", `%${searchQuery}%`);
    }

    // Apply sorting
    if (sortBy === "trending") {
      query = query.order("likes", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    res.json({ posts: posts || [] });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Create a new post with all features (stored in columns)
router.post("/posts", async (req, res) => {
  try {
    const {
      content,
      background,
      mediaUrls = [],
      categoryIds = [],
      mentionedUsers = [],
    } = req.body;

    // Create the post with all data stored as columns
    const { data: post, error: postError } = await supabase
      .from("anonymous_posts")
      .insert({
        content,
        background,
        media_urls: mediaUrls,
        categories: categoryIds,
        mentioned_users: mentionedUsers,
        reactions: [], // Initialize empty reactions array
        bookmarks: [], // Initialize empty bookmarks array
      })
      .select()
      .single();

    if (postError) throw postError;

    res.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Add reaction to post (stored in reactions column)
router.post("/posts/:postId/reactions", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userAlias, reactionType } = req.body;

    const reactionEmoji = {
      like: "👍",
      love: "❤️",
      laugh: "😂",
      wow: "😮",
      sad: "😢",
      angry: "😡",
    }[reactionType];

    // Get current post reactions
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("reactions")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentReactions = post.reactions || [];
    const reactionIndex = currentReactions.findIndex(
      (r) => r.userAlias === userAlias && r.reactionType === reactionType,
    );

    let updatedReactions;
    let action;

    if (reactionIndex > -1) {
      // Remove existing reaction
      updatedReactions = currentReactions.filter(
        (_, index) => index !== reactionIndex,
      );
      action = "removed";
    } else {
      // Add new reaction
      const newReaction = {
        userAlias,
        reactionType,
        emoji: reactionEmoji,
        createdAt: new Date().toISOString(),
      };
      updatedReactions = [...currentReactions, newReaction];
      action = "added";
    }

    // Update the post with new reactions
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ reactions: updatedReactions })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ action, reactions: updatedReactions });
  } catch (error) {
    console.error("Error handling reaction:", error);
    res.status(500).json({ error: "Failed to handle reaction" });
  }
});

// Toggle bookmark (stored in bookmarks column)
router.post("/posts/:postId/bookmark", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userAlias } = req.body;

    // Get current post bookmarks
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("bookmarks")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentBookmarks = post.bookmarks || [];
    const isBookmarked = currentBookmarks.includes(userAlias);

    let updatedBookmarks;
    let action;

    if (isBookmarked) {
      // Remove bookmark
      updatedBookmarks = currentBookmarks.filter(
        (alias) => alias !== userAlias,
      );
      action = "removed";
    } else {
      // Add bookmark
      updatedBookmarks = [...currentBookmarks, userAlias];
      action = "added";
    }

    // Update the post with new bookmarks
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ bookmarks: updatedBookmarks })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ action, bookmarks: updatedBookmarks });
  } catch (error) {
    console.error("Error handling bookmark:", error);
    res.status(500).json({ error: "Failed to handle bookmark" });
  }
});

// Get predefined categories
router.get("/categories", async (req, res) => {
  try {
    // Return predefined categories since they're stored as strings in the array
    const categories = [
      { id: "General", name: "General", color: "#6366f1" },
      { id: "Confession", name: "Confession", color: "#ef4444" },
      { id: "Advice", name: "Advice", color: "#10b981" },
      { id: "Story", name: "Story", color: "#f59e0b" },
      { id: "Question", name: "Question", color: "#8b5cf6" },
      { id: "Gratitude", name: "Gratitude", color: "#06b6d4" },
      { id: "Rant", name: "Rant", color: "#f97316" },
      { id: "Celebration", name: "Celebration", color: "#ec4899" },
      { id: "Help", name: "Help", color: "#84cc16" },
      { id: "Discussion", name: "Discussion", color: "#6b7280" },
    ];

    res.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Save draft
router.post("/drafts", async (req, res) => {
  try {
    const {
      userAlias,
      content,
      background,
      mediaUrls = [],
      categoryIds = [],
    } = req.body;

    const { data: draft, error } = await supabase
      .from("drafts")
      .insert({
        user_alias: userAlias,
        content,
        background,
        media_urls: mediaUrls,
        category_ids: categoryIds,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ draft });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

// Get user drafts
router.get("/drafts/:userAlias", async (req, res) => {
  try {
    const { userAlias } = req.params;

    const { data: drafts, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("user_alias", userAlias)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.json({ drafts: drafts || [] });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ error: "Failed to fetch drafts" });
  }
});

// Delete draft
router.delete("/drafts/:draftId", async (req, res) => {
  try {
    const { draftId } = req.params;

    const { error } = await supabase.from("drafts").delete().eq("id", draftId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

// Load draft
router.get("/drafts/:draftId/load", async (req, res) => {
  try {
    const { draftId } = req.params;

    const { data: draft, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (error) throw error;

    // Delete the draft after loading
    await supabase.from("drafts").delete().eq("id", draftId);

    res.json({ draft });
  } catch (error) {
    console.error("Error loading draft:", error);
    res.status(500).json({ error: "Failed to load draft" });
  }
});

// Get user bookmarks (from bookmarks column in posts)
router.get("/bookmarks/:userAlias", async (req, res) => {
  try {
    const { userAlias } = req.params;

    // Get posts where user is in bookmarks array
    const { data: bookmarks, error } = await supabase
      .from("anonymous_posts")
      .select("*")
      .contains("bookmarks", [userAlias])
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ bookmarks: bookmarks || [] });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// Increment post view count
router.post("/posts/:postId/view", async (req, res) => {
  try {
    const { postId } = req.params;
    const { viewerAlias } = req.body;

    // Increment view count
    const { error } = await supabase
      .from("anonymous_posts")
      .update({ view_count: supabase.raw("view_count + 1") })
      .eq("id", postId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error incrementing view:", error);
    res.status(500).json({ error: "Failed to increment view" });
  }
});

// Like/unlike post
router.post("/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userAlias } = req.body;

    // Get current post likes
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("likes")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentLikes = post.likes || [];
    const isLiked = currentLikes.includes(userAlias);

    let updatedLikes;
    let action;

    if (isLiked) {
      // Remove like
      updatedLikes = currentLikes.filter((alias) => alias !== userAlias);
      action = "unliked";
    } else {
      // Add like
      updatedLikes = [...currentLikes, userAlias];
      action = "liked";
    }

    // Update the post with new likes
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ likes: updatedLikes })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ action, likes: updatedLikes });
  } catch (error) {
    console.error("Error handling like:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Cleanup expired posts (manual trigger)
router.post("/cleanup", async (req, res) => {
  try {
    console.log("🧹 Starting cleanup of expired posts...");

    // Get expired posts with images
    const { data: expiredPosts, error: fetchError } = await supabase
      .from("anonymous_posts")
      .select("id, media_urls")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString())
      .not("media_urls", "is", null);

    if (fetchError) throw fetchError;

    let deletedCount = 0;
    const deletedImages = [];

    // Delete images from Supabase Storage and posts
    for (const post of expiredPosts || []) {
      if (post.media_urls && post.media_urls.length > 0) {
        // Extract filenames from URLs and delete from storage
        for (const imageUrl of post.media_urls) {
          try {
            // Extract filename from URL: https://xxx.supabase.co/storage/v1/object/public/images/filename.jpg
            const urlParts = imageUrl.split("/");
            const fileName = urlParts[urlParts.length - 1];

            if (fileName) {
              const { error: storageError } = await supabase.storage
                .from("images")
                .remove([fileName]);

              if (storageError) {
                console.error(
                  `Failed to delete image ${fileName}:`,
                  storageError,
                );
              } else {
                deletedImages.push(fileName);
              }
            }
          } catch (imageError) {
            console.error("Error deleting image:", imageError);
          }
        }
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from("anonymous_posts")
        .delete()
        .eq("id", post.id);

      if (!deleteError) {
        deletedCount++;
      }
    }

    console.log(
      `🗑️ Cleanup complete: Deleted ${deletedCount} posts and ${deletedImages.length} images`,
    );

    res.json({
      success: true,
      deletedPosts: deletedCount,
      deletedImages: deletedImages.length,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    res.status(500).json({ error: "Failed to cleanup expired posts" });
  }
});

// Add comment to post
router.post("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, userAlias, parentCommentId } = req.body;

    // Get current post
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("comments")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentComments = post.comments || [];

    // Create new comment
    const newComment = {
      id: crypto.randomUUID(),
      authorAlias: userAlias,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      replies: parentCommentId ? undefined : [],
    };

    let updatedComments;

    if (parentCommentId) {
      // Add as reply to existing comment
      updatedComments = currentComments.map((comment) => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment],
          };
        }
        return comment;
      });
    } else {
      // Add as top-level comment
      updatedComments = [...currentComments, newComment];
    }

    // Update post with new comments
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ comments: updatedComments })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Like/unlike comment
router.post("/posts/:postId/comments/:commentId/like", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userAlias } = req.body;

    // Get current post
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("comments")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentComments = post.comments || [];

    // Helper function to update likes in nested comments
    const updateCommentLikes = (comments) => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          const likes = comment.likes || [];
          const hasLiked = likes.includes(userAlias);
          return {
            ...comment,
            likes: hasLiked
              ? likes.filter((alias) => alias !== userAlias)
              : [...likes, userAlias],
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies),
          };
        }
        return comment;
      });
    };

    const updatedComments = updateCommentLikes(currentComments);

    // Update post with modified comments
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ comments: updatedComments })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ error: "Failed to like comment" });
  }
});

// Delete comment
router.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // Get current post
    const { data: post, error: getError } = await supabase
      .from("anonymous_posts")
      .select("comments")
      .eq("id", postId)
      .single();

    if (getError) throw getError;

    const currentComments = post.comments || [];

    // Helper function to remove comment from nested structure
    const removeComment = (comments) => {
      return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => {
          if (comment.replies) {
            return {
              ...comment,
              replies: removeComment(comment.replies),
            };
          }
          return comment;
        });
    };

    const updatedComments = removeComment(currentComments);

    // Update post with modified comments
    const { error: updateError } = await supabase
      .from("anonymous_posts")
      .update({ comments: updatedComments })
      .eq("id", postId);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Image uploads are now handled directly by Supabase Storage from the frontend
// No server-side proxy needed for better performance and reliability

export default router;
