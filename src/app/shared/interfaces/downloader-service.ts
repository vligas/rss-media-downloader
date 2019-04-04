import { VideoMetadata } from './video-metadata';

export interface DownloaderService {

    getMetadata(url: string): Promise<VideoMetadata>;
}
