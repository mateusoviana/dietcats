import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

export class StorageService {
  private static BUCKET_NAME = 'meal-photos';
  private static AVATAR_BUCKET_NAME = 'avatars';

  /**
   * Initializes storage buckets (call once on app start or setup)
   */
  static async initializeBuckets(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const mealBucketExists = buckets?.some(b => b.name === this.BUCKET_NAME);
      const avatarBucketExists = buckets?.some(b => b.name === this.AVATAR_BUCKET_NAME);

      if (!mealBucketExists) {
        await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        });
      }
      
      if (!avatarBucketExists) {
        await supabase.storage.createBucket(this.AVATAR_BUCKET_NAME, {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        });
      }
    } catch (error) {
      console.error('Error initializing storage buckets:', error);
    }
  }

  /**
   * Uploads a meal photo and returns the public URL
   */
  static async uploadPhoto(uri: string, userId: string): Promise<string> {
    return this.uploadFile(uri, userId, this.BUCKET_NAME);
  }

  /**
   * Uploads an avatar photo and returns the public URL
   */
  static async uploadAvatar(uri: string, userId: string): Promise<string> {
    return this.uploadFile(uri, userId, this.AVATAR_BUCKET_NAME);
  }
  
  /**
   * Generic file upload logic
   */
  private static async uploadFile(uri: string, userId: string, bucketName: string): Promise<string> {
    try {
      if (uri.startsWith('http')) {
        return uri;
      }

      const timestamp = Date.now();
      let fileExt = 'jpg';
      let contentType = 'image/jpeg';
      let arrayBuffer: ArrayBuffer;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        arrayBuffer = await blob.arrayBuffer();
        contentType = blob.type || 'image/jpeg';
        fileExt = contentType.split('/')[1] || 'jpg';
      } else {
        fileExt = uri.split('.').pop() || 'jpg';
        contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
        });
        arrayBuffer = decode(base64);
      }

      const fileName = `${userId}/${timestamp}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true, // Use upsert for avatars to overwrite
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucketName}:`, error);
      throw new Error(`Falha ao fazer upload do arquivo para ${bucketName}`);
    }
  }


  /**
   * Deletes a meal photo from storage
   */
  static async deletePhoto(fileUrl: string): Promise<void> {
    return this.deleteFile(fileUrl);
  }

  /**
   * Deletes a file from a specific storage bucket
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathWithBucket = url.pathname.split('/public/')[1];
      if (!pathWithBucket) return;

      const [bucketName, ...filePathParts] = pathWithBucket.split('/');
      const filePath = filePathParts.join('/');

      if (!bucketName || !filePath) return;

      await supabase.storage.from(bucketName).remove([filePath]);
    }
    catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  /**
   * Gets the size of a user's files in a specific bucket
   */
  static async getUserStorageSize(userId: string, bucketName: string = this.BUCKET_NAME): Promise<number> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(userId);

      if (error) throw error;

      return data?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;
    } catch (error) {
      console.error(`Error getting storage size for ${bucketName}:`, error);
      return 0;
    }
  }
}



