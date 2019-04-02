import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable({
  providedIn: 'root'
})
export class ProxyFetchService {

  constructor(private http: HTTP) { }

  proxyUrl = 'https://limitless-scrubland-76570.herokuapp.com';
  // proxyUrl = 'http://localhost:3001';
  fetch(url, options?: RequestInit) {
    return this.http.get(url, {
      ...options
    }, {});
  }
}
