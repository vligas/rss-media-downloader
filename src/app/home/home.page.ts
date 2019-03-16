import { Component } from '@angular/core';
import { ToastController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { InstagramDownloaderService } from '../shared/services/instagram-downloader.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  link = '';
  previewSrc = '';
  loading: boolean;
  metadata: any = {};

  constructor(
    private toastController: ToastController,
    private platform: Platform,
    private file: File,
    private instagramDownloader: InstagramDownloaderService
  ) {
  }

  async downloadPress() {
    this.previewSrc = '';
    this.loading = true;

    try {
      const { content, metadata } = await this.instagramDownloader.download(this.link);
      await this.file.writeFile(this.file.externalRootDirectory + '/Download/', metadata.filename, content);

      this.metadata = metadata;
      this.previewSrc = URL.createObjectURL(content);

    } catch (e) {
      this.toast(e.message);
    }
    finally {
      this.loading = false;
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
