import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

export class StorageService {
  private static BUCKET_NAME = 'meal-photos';

  /**
   * Initializes the storage bucket (call once on app start or setup)
   */
  static async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === this.BUCKET_NAME);
      
      if (!exists) {
        await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        });
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  /**
   * Uploads a photo and returns the public URL
   * @param uri - Local file URI or remote URL
   * @param userId - User ID for organizing files
   * @returns Public URL of the uploaded photo or the original URL if it's already remote
   */
  static async uploadPhoto(uri: string, userId: string): Promise<string> {
    try {
      // If it's already a URL from internet, return as-is
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}/${timestamp}.${fileExt}`;

      let arrayBuffer: ArrayBuffer;

      // Different handling for web vs mobile
      if (Platform.OS === 'web') {
        // Web: Convert blob URL to blob
        arrayBuffer = await this.getBlobFromUri(uri);
      } else {
        // Mobile: Read as base64 and convert
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        arrayBuffer = decode(base64);
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Falha ao fazer upload da foto');
    }
  }

  /**
   * Web-specific: Convert blob URL to ArrayBuffer
   */
  private static async getBlobFromUri(blobUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }

  /**
   * Deletes a photo from storage
   * @param photoUrl - Full URL of the photo
   */
  static async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // Only delete if it's from our storage
      if (!photoUrl.includes(this.BUCKET_NAME)) {
        return;
      }

      // Extract path from URL
      const urlParts = photoUrl.split(`${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) return;

      const filePath = urlParts[1].split('?')[0]; // Remove query params

      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Don't throw - deletion failure shouldn't block other operations
    }
  }

  /**
   * Gets the size of a user's photos in bytes
   */
  static async getUserStorageSize(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (error) throw error;

      return data?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }
}



