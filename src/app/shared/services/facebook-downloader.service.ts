import { Injectable } from '@angular/core';
import { DownloaderService } from '../interfaces/downloader-service';
import { ProxyFetchService } from './proxy-fetch.service';
import { VideoMetadata } from '../interfaces/video-metadata';

@Injectable({
  providedIn: 'root'
})
export class FacebookDownloaderService implements DownloaderService {

  constructor(private proxyFetch: ProxyFetchService) { }

  highResolutionURL(html: string) {
    console.log(html);
    return html.split('hd_src:"')[1].split('",sd_src:"')[0];
  }

  lowResolutionURL(html: string) {
    console.log(html);
    return html.split('sd_src:"')[1].split('",hd_tag')[0];
  }

  async getMetadata(url: string): Promise<VideoMetadata> {
    const response = await this.proxyFetch.fetch(url);
    const html = await response.text();

    return {
      filename: new Date().getTime().toString() + '.mp4',
      formats: [{ url: this.highResolutionURL(html), label: 'hd' }, { url: this.lowResolutionURL(html), label: 'sd' }],
      isVideo: true,
      mimeType: 'video/mp4'
    };
  }

  async download(url: string) {

    const metadata = await this.getMetadata(url);
    const videoResponse = await this.proxyFetch.fetch(metadata.formats[0].url);

    return {
      content: await videoResponse.blob(),
      metadata
    };
  }
}
