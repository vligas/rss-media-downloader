import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ToastController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import download from 'downloadjs';

import { DownloaderService } from '../shared/services/downloader.service';
import { VideoMetadata } from '../shared/interfaces/video-metadata';
import { ProxyFetchService } from '../shared/services/proxy-fetch.service';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';

const ReadableStream2: any = ReadableStream;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  link = '';
  previewSrc = '';
  selectedFormat;
  loadingVideo: boolean;
  loadingMetadata = false;
  metadata: any = {};
  progress = '0%';
  brand: string;
  showFooter = true;
  fileTransfer: FileTransferObject = this.transfer.create();

  constructor(
    private toastController: ToastController,
    private file: File,
    private socialSharing: SocialSharing,
    private downloader: DownloaderService,
    private proxyFetch: ProxyFetchService,
    private admobFree: AdMobFree,
    private platform: Platform,
    private keyboard: Keyboard,
    private http: HTTP,
    private change: ChangeDetectorRef,
    private transfer: FileTransfer
  ) {
  }
  async ngOnInit() {
    await this.platform.ready();
    this.keyboard.onKeyboardShow().subscribe(() => {
      this.showFooter = false;
    });

    this.keyboard.onKeyboardHide().subscribe(() => {
      this.showFooter = true;
    });
  }

  onProgress(progress) {
    console.log(progress);
    this.progress = Math.round(progress.loaded / progress.total * 100) + '%';
    console.log(this.progress);
    this.change.detectChanges();
  }

  restartPage() {
    this.link = '';
    this.metadata = {};
    this.selectedFormat = undefined;
    this.progress = '0%';
    this.brand = '';

  }

  async downloadVideo() {
    if (!this.loadingVideo) {
      this.loadingVideo = true;
      const url = this.selectedFormat.url;
      try {
        this.fileTransfer.onProgress(this.onProgress.bind(this));
        const path = `${this.file.externalRootDirectory}/Download/${this.metadata.filename}`;
        await this.fileTransfer.download(url, path);
        (cordova.plugins as any).MediaScannerPlugin.scanFile(path);
        await this.socialSharing.share('', '', path, this.link);
        this.loadingVideo = false;
        this.restartPage();

      } catch (e) {
        this.restartPage();
        console.error(e);
        this.toast('Error en la descarga');
        this.loadingVideo = false;
      }
    }

  }

  async handleURL() {
    if (this.link !== undefined && this.link.trim() !== '') {

      this.previewSrc = '';
      this.loadingMetadata = true;
      try {
        const url = new URL(this.link);
        let metadata: VideoMetadata;
        console.log(url.host);

        switch (url.host) {
          case 'youtu.be':
          case 'www.youtube.com': {
            let link = url.href;
            if (url.host === 'youtu.be') {
              link = `https://www.youtube.com/watch?v=${url.pathname.substring(1)}`;
            }
            metadata = await this.downloader.getMetadata(link, 'youtube');
            this.brand = 'youtube';
            break;
          }

          case 'www.instagram.com': {
            metadata = await this.downloader.getMetadata(url.href, 'instagram');
            this.brand = 'instagram';
            break;
          }

          case 'www.facebook.com': {
            metadata = await this.downloader.getMetadata(url.href, 'facebook');
            this.brand = 'facebook';
            break;
          }
          default: {
            throw new Error('Invalid host name');
          }
        }

        if (metadata.formats.length === 1) {
          this.selectedFormat = metadata.formats[0];
        }
        this.metadata = metadata;

      } catch (e) {
        console.log(e);
        this.brand = '';
        this.loadingMetadata = false;
        this.selectedFormat = undefined;
        this.metadata = {};
        this.toast('No es una URL valida.');
      }
      finally {
        this.loadingMetadata = false;
      }
    } else {
      this.brand = '';
      this.loadingMetadata = false;
      this.selectedFormat = undefined;
      this.metadata = {};
    }
  }


  async toast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    toast.present();

  }
}
