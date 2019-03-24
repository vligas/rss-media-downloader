import { TestBed } from '@angular/core/testing';

import { FacebookDownloaderService } from './facebook-downloader.service';

describe('FacebookDownloaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FacebookDownloaderService = TestBed.get(FacebookDownloaderService);
    expect(service).toBeTruthy();
  });
});
