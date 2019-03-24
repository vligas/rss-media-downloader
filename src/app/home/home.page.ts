import { Component, OnInit } from '@angular/core';
import { ToastController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';


import { DownloaderService } from '../shared/services/downloader.service';
import { VideoMetadata } from '../shared/interfaces/video-metadata';
import { ProxyFetchService } from '../shared/services/proxy-fetch.service';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free/ngx';
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
  progress: any;
  brand: string;

  constructor(
    private toastController: ToastController,
    private file: File,
    private socialSharing: SocialSharing,
    private downloader: DownloaderService,
    private proxyFetch: ProxyFetchService,
    private admobFree: AdMobFree,
  ) {
  }
  async ngOnInit() {
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
      new ReadableStream({
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
    await this.file.writeFile(this.file.externalRootDirectory + '/Download/', filename, content);
    await this.socialSharing.share('', '', `${this.file.externalRootDirectory}/Download/${filename}`, this.link);
  }

  restartPage() {
    this.link = '';
    this.metadata = {};
    this.selectedFormat = undefined;
    this.progress = undefined;
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
      switch (url.host) {
        case 'www.youtube.com': {
          metadata = await this.downloader.getMetadata(url.href, 'youtube');
          this.brand = 'youtube';
          break;
        }

        case 'www.instagram.com': {
          metadata = await this.downloader.getMetadata(url.href, 'instagram');
          this.selectedFormat = metadata.formats[0];
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
