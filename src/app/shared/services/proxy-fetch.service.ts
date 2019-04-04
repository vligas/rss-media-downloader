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
    }, {
        'access-control-allow-origin': '*',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.45 Safari/535.19'
      });
  }
}
