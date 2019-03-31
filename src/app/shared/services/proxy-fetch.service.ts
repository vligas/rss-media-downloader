import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProxyFetchService {

  constructor() { }

  proxyUrl = 'https://limitless-scrubland-76570.herokuapp.com';
  // proxyUrl = 'http://localhost:3001';
  fetch(url, options?: RequestInit) {
    return window.fetch(`${this.proxyUrl}/${url}`, {
      ...options
    });
  }
}
