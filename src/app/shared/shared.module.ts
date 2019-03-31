import { YoutubeDownloaderService } from './services/youtube-downloader.service';
import { InstagramDownloaderService } from './services/instagram-downloader.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [BrandLogoComponent],
  imports: [
    CommonModule,
    IonicModule.forRoot(),
  ],
  providers: [
    InstagramDownloaderService,
    YoutubeDownloaderService
  ],
  exports: [
    BrandLogoComponent
  ]
})
export class SharedModule { }
