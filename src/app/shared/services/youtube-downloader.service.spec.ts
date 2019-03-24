import { TestBed } from '@angular/core/testing';

import { YoutubeDownloaderService } from './youtube-downloader.service';

describe('YoutubeDownloaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: YoutubeDownloaderService = TestBed.get(YoutubeDownloaderService);
    expect(service).toBeTruthy();
  });
});
