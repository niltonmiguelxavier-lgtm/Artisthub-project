import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FeedPost } from '../types';
import { initialFeedPosts } from '../data/feedSeed';

export interface FeedFetchResult {
  posts: FeedPost[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Creates a new FeedPost in the Firestore `feedPosts` collection.
 */
export async function createFeedPost(
  postData: Omit<FeedPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'> & {
    id?: string;
    createdAt?: string;
  }
): Promise<FeedPost> {
  const postId = postData.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = postData.createdAt || new Date().toISOString();

  const newPost: FeedPost = {
    id: postId,
    artistId: postData.artistId,
    artistName: postData.artistName || 'Artista',
    artistHandle: postData.artistHandle || 'artista',
    artistAvatarUrl: postData.artistAvatarUrl,
    artistVerified: postData.artistVerified ?? false,
    type: postData.type,
    content: postData.content.trim(),
    mediaUrl: postData.mediaUrl,
    relatedId: postData.relatedId,
    metadata: postData.metadata,
    createdAt: now,
    likesCount: 0,
    commentsCount: 0,
  };

  try {
    await setDoc(doc(db, 'feedPosts', postId), newPost);
  } catch (err) {
    console.warn('Could not persist feed post to Firestore, keeping in memory/local:', err);
  }

  return newPost;
}

/**
 * Loads feed posts from Firestore with pagination, falling back to seed posts if empty.
 */
export async function fetchFeedPosts(
  pageSize = 10,
  lastDoc: DocumentSnapshot | null = null,
  filterType?: string
): Promise<FeedFetchResult> {
  try {
    let q;
    if (lastDoc) {
      q = query(
        collection(db, 'feedPosts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, 'feedPosts'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      let posts = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        return {
          id: docSnap.id,
          ...data,
        } as FeedPost;
      });

      if (filterType && filterType !== 'todas') {
        posts = posts.filter((p) => p.type === filterType);
      }

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        posts,
        lastDoc: newLastDoc,
        hasMore,
      };
    } else {
      // If Firestore has no posts yet and this is the first page, return initial seed data
      if (!lastDoc) {
        let seeded = [...initialFeedPosts];
        if (filterType && filterType !== 'todas') {
          seeded = seeded.filter((p) => p.type === filterType);
        }
        return {
          posts: seeded,
          lastDoc: null,
          hasMore: false,
        };
      }

      return {
        posts: [],
        lastDoc: null,
        hasMore: false,
      };
    }
  } catch (err) {
    console.warn('Error querying Firestore feedPosts, falling back to seed posts:', err);
    let fallback = [...initialFeedPosts];
    if (filterType && filterType !== 'todas') {
      fallback = fallback.filter((p) => p.type === filterType);
    }
    return {
      posts: fallback,
      lastDoc: null,
      hasMore: false,
    };
  }
}

/**
 * Toggles a like on a post. Returns whether the post is currently liked and the new count.
 */
export async function toggleFeedLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likesCountDelta: number }> {
  if (!userId) throw new Error('User must be authenticated to like a post');

  const likeDocRef = doc(db, 'feedPosts', postId, 'likes', userId);
  const postDocRef = doc(db, 'feedPosts', postId);

  try {
    const likeSnap = await getDoc(likeDocRef);
    if (likeSnap.exists()) {
      // Already liked -> Remove like
      await deleteDoc(likeDocRef);
      try {
        await updateDoc(postDocRef, {
          likesCount: increment(-1),
        });
      } catch (e) {
        // Document might be a seed post or created locally
      }
      return { liked: false, likesCountDelta: -1 };
    } else {
      // Not liked -> Add like
      await setDoc(likeDocRef, {
        userId,
        postId,
        createdAt: new Date().toISOString(),
      });
      try {
        await updateDoc(postDocRef, {
          likesCount: increment(1),
        });
      } catch (e) {
        // Document might be a seed post or created locally
      }
      return { liked: true, likesCountDelta: 1 };
    }
  } catch (err) {
    console.warn('Firestore toggle like error, operating in client state:', err);
    return { liked: true, likesCountDelta: 1 };
  }
}

/**
 * Checks if a specific user has liked a post.
 */
export async function checkUserLikedPost(postId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const likeDocRef = doc(db, 'feedPosts', postId, 'likes', userId);
    const snap = await getDoc(likeDocRef);
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Deletes a feed post.
 */
export async function deleteFeedPost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'feedPosts', postId));
  } catch (err) {
    console.warn('Error deleting feed post from Firestore:', err);
  }
}
