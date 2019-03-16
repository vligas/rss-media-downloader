import { TestBed } from '@angular/core/testing';

import { InstagramDownloaderService } from './instagram-downloader.service';

describe('InstagramDownloaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InstagramDownloaderService = TestBed.get(InstagramDownloaderService);
    expect(service).toBeTruthy();
  });
});
