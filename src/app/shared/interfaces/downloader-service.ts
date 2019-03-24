import { VideoMetadata } from './video-metadata';

export interface DownloaderService {
    download(url: string): Promise<{
        content: Blob,
        metadata: VideoMetadata
    }>;

    getMetadata(url: string): Promise<VideoMetadata>;
}
