import { YoutubeDownloaderService } from './services/youtube-downloader.service';
import { InstagramDownloaderService } from './services/instagram-downloader.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    InstagramDownloaderService,
    YoutubeDownloaderService
  ],
  exports: []
})
export class SharedModule { }
