import supabase from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

class ProfileService {
  async uploadAvatar(userId: string, base64File: string): Promise<string> {
    const fileExt = 'png';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64File), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload do avatar: ' + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    if (!publicUrlData) {
      throw new Error('Não foi possível obter a URL pública do avatar.');
    }

    return publicUrlData.publicUrl;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      throw new Error('Erro ao atualizar o avatar: ' + error.message);
    }
  }
}

export const profileService = new ProfileService();
