import { db, doc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where, increment } from '../lib/firebase';
import { deleteTrackMedia } from './storageService';
import type { Track, YouTubeVideo } from '../types';

const STREAM_COOLDOWN_MS = 45000; // 45 seconds anti-fraud / cooldown per track

/**
 * Increments stream count in Firestore with client-side anti-fraud cooldown.
 */
export async function recordTrackStream(trackId: string): Promise<boolean> {
  if (!trackId) return false;

  try {
    const storageKey = `artisthub_stream_ts_${trackId}`;
    const lastStreamTime = localStorage.getItem(storageKey);
    const now = Date.now();

    if (lastStreamTime && now - Number(lastStreamTime) < STREAM_COOLDOWN_MS) {
      // Cooldown active, do not double-count
      return false;
    }

    localStorage.setItem(storageKey, String(now));

    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, {
      streams: increment(1),
    });
    return true;
  } catch (error) {
    // If track is in demo fallback or permission restricted, ignore silently
    console.warn('Stream count increment note:', error);
    return false;
  }
}

/**
 * Checks if a track has associated sales or active exclusive product listings in Store.
 */
export async function checkTrackHasStoreSales(trackId: string, trackTitle?: string): Promise<{ hasSales: boolean; reason?: string }> {
  try {
    // 1. Check orders collection
    const ordersSnap = await getDocs(query(collection(db, 'orders'), where('productId', '==', trackId)));
    if (!ordersSnap.empty) {
      return {
        hasSales: true,
        reason: `Esta faixa tem ${ordersSnap.size} venda(s) registada(s) na Loja Digital. Para proteger o acesso dos compradores, não pode ser eliminada diretamente.`,
      };
    }

    // 2. Check if product with this track ID or title exists and has sales
    const prodRef = doc(db, 'products', trackId);
    const prodDoc = await getDoc(prodRef);
    if (prodDoc.exists()) {
      const prodData = prodDoc.data();
      if ((prodData.salesCount && prodData.salesCount > 0) || prodData.isAvailable) {
        return {
          hasSales: true,
          reason: 'Esta faixa está ativa ou tem vendas na Loja Digital como produto exclusivo. Remove-a da Loja primeiro antes de a eliminar.',
        };
      }
    }

    return { hasSales: false };
  } catch (err) {
    console.warn('Store check fallback:', err);
    return { hasSales: false };
  }
}

/**
 * Safely deletes a track, cleaning up Firebase Storage and preventing deletion if sold in store.
 */
export async function deleteTrackWithProtection(
  artistId: string,
  trackId: string,
  trackTitle?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check store sales
    const storeCheck = await checkTrackHasStoreSales(trackId, trackTitle);
    if (storeCheck.hasSales) {
      return {
        success: false,
        error: storeCheck.reason || 'Esta faixa tem vendas associadas na Loja. Remove-a da loja primeiro para proteger o histórico dos fãs.',
      };
    }

    // Fetch track document to retrieve exact audio and cover URLs for storage cleanup
    let audioUrl: string | undefined;
    let coverUrl: string | undefined;

    try {
      const trackSnap = await getDoc(doc(db, 'tracks', trackId));
      if (trackSnap.exists()) {
        const data = trackSnap.data();
        audioUrl = data.audioUrl;
        coverUrl = data.coverUrl;
      }
    } catch (e) {
      console.warn('Could not read track before delete:', e);
    }

    // Clean up Firebase Storage files
    await deleteTrackMedia(artistId, trackId, audioUrl, coverUrl);

    // Delete Firestore document
    await deleteDoc(doc(db, 'tracks', trackId));

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting track:', error);
    return {
      success: false,
      error: error?.message || 'Não foi possível eliminar a faixa. Tenta novamente.',
    };
  }
}

/**
 * Deletes a video document from Firestore.
 */
export async function deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'videos', videoId));
    // also clean up legacy collection if present
    try {
      await deleteDoc(doc(db, 'youtube_videos', videoId));
    } catch {}
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return {
      success: false,
      error: error?.message || 'Não foi possível eliminar o vídeo.',
    };
  }
}

/**
 * Updates a track document in Firestore.
 */
export async function updateTrackData(
  trackId: string,
  updates: Partial<Track>
): Promise<{ success: boolean; error?: string }> {
  try {
    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, updates);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating track:', error);
    return {
      success: false,
      error: error?.message || 'Não foi possível atualizar os dados da faixa.',
    };
  }
}
