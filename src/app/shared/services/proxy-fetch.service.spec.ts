import { TestBed } from '@angular/core/testing';

import { ProxyFetchService } from './proxy-fetch.service';

describe('ProxyFetchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProxyFetchService = TestBed.get(ProxyFetchService);
    expect(service).toBeTruthy();
  });
});
