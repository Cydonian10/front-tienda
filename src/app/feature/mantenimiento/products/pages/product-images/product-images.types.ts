import { Image } from '../../../../../core/models/image.model';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface ImageUpload {
  id: number;
  file?: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error: string | null;
  retryable: boolean;
  image?: Image;
}
