export interface DownloaderService {
    download(url: string): Promise<{
        content: Blob,
        metadata: any
    }>;
}
