import { VideoMetadata } from './../interfaces/video-metadata';
import { Injectable } from '@angular/core';
import { DownloaderService } from '../interfaces/downloader-service';
import * as $ from 'jquery';

@Injectable()
export class InstagramDownloaderService implements DownloaderService {

  constructor() { }

  private createFileName(name, mimetype) {
    const mimeTypeMap = {
      'image/jpeg': '.jpg',
      'video/mp4': '.mp4',
      'video/ogg': '.ogg',
      'video/webm': '.webm'
    };
    const extension = mimeTypeMap[mimetype];
    return `${name}${extension}`;
  }

  public async getMetadata(url: string) {
    const htmlResponse = await fetch(url);
    const html = await htmlResponse.text();

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
      formats: [{ url: downloadUrl, label: 'unique' }],
    };

  }


  public async download(url: string) {

    const metadata = await this.getMetadata(url);


    await fetch(metadata.formats[0].url, {
      method: 'HEAD',
    });

    const mediaResponse = await fetch(metadata.formats[0].url);
    const media = await mediaResponse.blob();

    return {
      content: media,
      metadata
    };
  }
}
