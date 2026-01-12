import { supabase } from './supabase';

const BUCKET_NAME = 'rink-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Upload a photo to Supabase Storage
 * @param file - The file to upload
 * @param userId - User ID for file naming
 * @returns Public URL of the uploaded photo
 */
export async function uploadRinkPhoto(file: File, userId: string): Promise<string | null> {
    try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File size must be less than 5MB');
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error('File must be JPG, PNG, or WEBP');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading photo:', error);
        return null;
    }
}

/**
 * Delete a photo from Supabase Storage
 */
export async function deleteRinkPhoto(photoUrl: string): Promise<boolean> {
    try {
        const fileName = photoUrl.split('/').pop();
        if (!fileName) return false;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting photo:', error);
        return false;
    }
}
