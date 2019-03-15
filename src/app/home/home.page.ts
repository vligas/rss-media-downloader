import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';

import axios from 'axios';
import * as $ from 'jquery';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  link = '';
  previewSrc = '';
  loading: boolean;

  constructor(private toastController: ToastController, private file: File, private transfer: FileTransfer) {}

  createFileName(name, mimetype) {
    const mimeTypeMap = {
      'image/jpeg': '.jpg',
      'video/mp4': '.mp4',
      'video/ogg': '.ogg',
      'video/webm': '.webm'
    };
    const extension = mimeTypeMap[mimetype];
    return `${name}${extension}`;
  }

  getMetadata(html: string) {
    const $html = $($.parseHTML(html));

    const canonicalUrl = $html.filter('link[rel="canonical"]').attr('href');
    const isVideo = $html.filter('meta[name="medium"]').attr('content') === 'video';
    const mimeType = isVideo ? $html.filter('meta[property="og:video:type"]').attr('content') : 'image/jpeg';

    const partsOfCanonicalurl = canonicalUrl.split('/');
    const indexOfP = partsOfCanonicalurl.indexOf('p');
    const mediaId = partsOfCanonicalurl[indexOfP + 1];
    const filename = this.createFileName(mediaId, mimeType);
    const downloadUrl = isVideo ?
      $html.filter('meta[property="og:video"]').attr('content') :
      $html.filter('meta[property="og:image"]').attr('content');

    return {
      isVideo,
      mimeType,
      filename,
      downloadUrl,
    };

  }

  // async loading(start: boolean) {

  // }

  async downloadPress() {
    try {
      this.previewSrc = '';
      this.loading = true;
      const htmlResponse = await fetch(this.link);
      const data = await htmlResponse.text();
      const metadata = this.getMetadata(data);


        await fetch(metadata.downloadUrl, {
          method: 'HEAD',
        });

        this.log('FETCHING VIDEO ...');
        const mediaResponse = await fetch(metadata.downloadUrl);
        const media = await mediaResponse.blob();
        await this.file.writeFile(this.file.externalRootDirectory + '/Download/', metadata.filename, media);
        this.log('VIDEO FETCHED!');
        this.previewSrc = URL.createObjectURL(media);
        // console.log(videoResponse.data);

    } catch (e) {
      const toast = await this.toastController.create({
        message: e.message,
        duration: 2000
      });
      toast.present();
    }
    finally {
      this.loading = false;
    }
  }

  async log(message) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000
    });
    toast.present();
  }

}
