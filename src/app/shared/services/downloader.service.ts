import { Injectable } from '@angular/core';
import { FacebookDownloaderService } from './facebook-downloader.service';
import { InstagramDownloaderService } from './instagram-downloader.service';
import { YoutubeDownloaderService } from './youtube-downloader.service';


export type VideoSource = 'youtube' | 'instagram' | 'facebook';

@Injectable({
  providedIn: 'root'
})
export class DownloaderService {

  constructor(private facebookDownloader: FacebookDownloaderService,
    private instagramDownloader: InstagramDownloaderService,
    private youtubeDownloader: YoutubeDownloaderService) { }

  async getMetadata(link: string, source: VideoSource) {
    switch (source) {
      case 'facebook': {
        return await this.facebookDownloader.getMetadata(link);
      }
      case 'instagram': {
        return await this.instagramDownloader.getMetadata(link);
      }
      case 'youtube': {
        return await this.youtubeDownloader.getMetadata(link);
      }
      default: {
        throw new Error('The video source is not supported.');
      }
    }
  }

  // async download(link: string, source: VideoSource) {
  //   switch (source) {
  //     case 'facebook': {
  //       return await this.facebookDownloader.download(link);
  //     }
  //     case 'instagram': {
  //       return await this.instagramDownloader.download(link);
  //     }
  //     case 'youtube': {
  //       return await this.youtubeDownloader.download(link);
  //     }
  //     default: {
  //       throw new Error('The video source is not supported.');
  //     }
  //   }

  // }
}
