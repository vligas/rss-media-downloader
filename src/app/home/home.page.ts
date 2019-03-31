import { Component, OnInit } from '@angular/core';
import { ToastController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import download from 'downloadjs';

import { DownloaderService } from '../shared/services/downloader.service';
import { VideoMetadata } from '../shared/interfaces/video-metadata';
import { ProxyFetchService } from '../shared/services/proxy-fetch.service';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';

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

  constructor(
    private toastController: ToastController,
    private file: File,
    private socialSharing: SocialSharing,
    private downloader: DownloaderService,
    private proxyFetch: ProxyFetchService,
    private admobFree: AdMobFree,
    private platform: Platform,
    private keyboard: Keyboard
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
    this.progress = Math.round(progress.loaded / progress.total * 100) + '%';
    console.log(this.progress);
  }
  downloadProgress(response) {
    if (!response.ok) {
      throw Error(response.status + ' ' + response.statusText);
    }

    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    let loaded = 0;
    const that = this;
    return new Response(
      new ReadableStream2({
        start(controller) {
          const reader = response.body.getReader();

          read();
          async function read() {
            console.log('aqui');
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            loaded += value.byteLength;
            console.log(that);
            that.onProgress({ loaded, total });
            controller.enqueue(value);
            read();
          }
        }
      })
    );
  }




  async saveVideo(content: Blob, filename: string) {
    // download(content, filename);
    await this.file.writeFile(this.file.externalRootDirectory + '/Download/', filename, content);
    await this.socialSharing.share('', '', `${this.file.externalRootDirectory}/Download/${filename}`, this.link);
  }

  restartPage() {
    this.link = '';
    this.metadata = {};
    this.selectedFormat = undefined;
    this.progress = '0%';
    this.brand = '';

  }

  downloadVideo() {
    this.loadingVideo = true;
    const url = this.selectedFormat.url;
    this.proxyFetch.fetch(url)
      .then(this.downloadProgress.bind(this))
      .then(response => response.blob())
      .then(blob => this.saveVideo(blob, this.metadata.filename))
      .then(_ => {
        this.loadingVideo = false;
        this.restartPage();
      })
      .catch(e => {
        this.restartPage();
        console.error(e);
        this.toast('Error en la descarga');
        this.loadingVideo = false;
      });
  }

  async handleURL() {
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
  }


  async toast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    toast.present();

  }
}
