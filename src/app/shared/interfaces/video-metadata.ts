export interface VideoMetadata {
    isVideo: boolean;
    mimeType: string;
    filename: string;
    formats: { url: string, label: string }[];
}
