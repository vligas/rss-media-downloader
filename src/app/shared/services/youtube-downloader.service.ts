import { DownloaderService } from './../interfaces/downloader-service';
import { formats as FORMATS } from './formtas';
import { Injectable } from '@angular/core';
import axios from 'axios';
import { ProxyFetchService } from './proxy-fetch.service';


const jsVarStr = '[a-zA-Z_\\$][a-zA-Z_0-9]*';
const jsSingleQuoteStr = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`;
const jsDoubleQuoteStr = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`;
const jsQuoteStr = `(?:${jsSingleQuoteStr}|${jsDoubleQuoteStr})`;
const jsKeyStr = `(?:${jsVarStr}|${jsQuoteStr})`;
const jsPropStr = `(?:\\.${jsVarStr}|\\[${jsQuoteStr}\\])`;
const jsEmptyStr = `(?:''|"")`;
const reverseStr = ':function\\(a\\)\\{' +
  '(?:return )?a\\.reverse\\(\\)' +
  '\\}';
const sliceStr = ':function\\(a,b\\)\\{' +
  'return a\\.slice\\(b\\)' +
  '\\}';
const spliceStr = ':function\\(a,b\\)\\{' +
  'a\\.splice\\(0,b\\)' +
  '\\}';
const swapStr = ':function\\(a,b\\)\\{' +
  'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c(?:;return a)?' +
  '\\}';
const actionsObjRegexp = new RegExp(
  `var (${jsVarStr})=\\{((?:(?:` +
  jsKeyStr + reverseStr + '|' +
  jsKeyStr + sliceStr + '|' +
  jsKeyStr + spliceStr + '|' +
  jsKeyStr + swapStr +
  '),?\\r?\\n?)+)\\};'
);
const actionsFuncRegexp = new RegExp(`function(?: ${jsVarStr})?\\(a\\)\\{` +
  `a=a\\.split\\(${jsEmptyStr}\\);\\s*` +
  `((?:(?:a=)?${jsVarStr}` +
  jsPropStr +
  '\\(a,\\d+\\);)+)' +
  `return a\\.join\\(${jsEmptyStr}\\)` +
  '\\}'
);
const reverseRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${reverseStr}`, 'm');
const sliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${sliceStr}`, 'm');
const spliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${spliceStr}`, 'm');
const swapRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${swapStr}`, 'm');


@Injectable()
export class YoutubeDownloaderService implements DownloaderService {

  constructor(private proxyFetch: ProxyFetchService) { }
  cache = new Map();

  private swapHeadAndPosition(arr, position) {
    const first = arr[0];
    arr[0] = arr[position % arr.length];
    arr[position] = first;
    return arr;
  }

  private addFormatMeta(format) {
    const meta = FORMATS[format.itag];
    for (const key in meta) {
      format[key] = meta[key];
    }

    format.live = /\/source\/yt_live_broadcast\//.test(format.url);
    format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
    format.isDashMPD = /\/manifest\/dash\//.test(format.url);
  }


  private sortFormats(a, b) {
    const ares = a.resolution ? parseInt(a.resolution.slice(0, -1), 10) : 0;
    const bres = b.resolution ? parseInt(b.resolution.slice(0, -1), 10) : 0;
    const afeats = ~~!!ares * 2 + ~~!!a.audioBitrate;
    const bfeats = ~~!!bres * 2 + ~~!!b.audioBitrate;

    const getBitrate = (c) => {
      if (c.bitrate) {
        const s = c.bitrate.split('-');
        return parseFloat(s[s.length - 1]);
      } else {
        return 0;
      }
    };
  }

  private parseFormats(info) {
    let formats = [];
    if (info.url_encoded_fmt_stream_map) {
      formats = formats
        .concat(info.url_encoded_fmt_stream_map.split(','));
    }
    if (info.adaptive_fmts) {
      formats = formats.concat(info.adaptive_fmts.split(','));
    }

    formats = formats.map((format) => {
      const search = new URLSearchParams(format);
      const result: any = {};
      search.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    });
    delete info.url_encoded_fmt_stream_map;
    delete info.adaptive_fmts;

    return formats;
  }

  private decipher(tokens, sig) {
    sig = sig.split('');
    for (let i = 0, len = tokens.length; i < len; i++) {
      let token = tokens[i], pos;
      switch (token[0]) {
        case 'r':
          sig = sig.reverse();
          break;
        case 'w':
          pos = ~~token.slice(1);
          sig = this.swapHeadAndPosition(sig, pos);
          break;
        case 's':
          pos = ~~token.slice(1);
          sig = sig.slice(pos);
          break;
        case 'p':
          pos = ~~token.slice(1);
          sig.splice(0, pos);
          break;
      }
    }
    return sig.join('');
  }

  private decipherFormats(formats, tokens) {
    formats.forEach((format) => {
      const sig = tokens && format.s ? this.decipher(tokens, format.s) : null;
      this.setDownloadURL(format, sig, true);
    });
  }

  private setDownloadURL(format, sig, debug) {
    let decodedUrl;
    if (format.url) {
      decodedUrl = format.url;
    } else {
      if (debug) {
        console.warn('Download url not found for itag ' + format.itag);
      }
      return;
    }

    try {
      decodedUrl = decodeURIComponent(decodedUrl);
    } catch (err) {
      if (debug) {
        console.warn('Could not decode url: ' + err.message);
      }
      return;
    }

    // Make some adjustments to the final url.
    const parsedUrl = new URL(decodedUrl);

    // Deleting the `search` part is necessary otherwise changes to
    // `query` won't reflect when running `url.format()`

    // const query = parsedUrl.query;

    // This is needed for a speedier download.
    // See https://github.com/fent/node-ytdl-core/issues/127
    parsedUrl.searchParams.set('ratebypass', 'yes');
    if (sig) {
      parsedUrl.searchParams.set('signature', sig);
    }

    format.url = parsedUrl.href;
  }

  private indexOf(haystack, needle) {
    return needle instanceof RegExp ?
      haystack.search(needle) : haystack.indexOf(needle);
  }

  private mergeFormats(info, formatsMap) {
    info.formats.forEach((f) => {
      if (!formatsMap[f.itag]) {
        formatsMap[f.itag] = f;
      }
    });
    info.formats = [];
    for (const itag in formatsMap) { info.formats.push(formatsMap[itag]); }
  }


  private between(haystack, left, right) {
    let pos = this.indexOf(haystack, left);
    if (pos === -1) { return ''; }
    haystack = haystack.slice(pos + left.length);
    pos = this.indexOf(haystack, right);
    if (pos === -1) { return ''; }
    haystack = haystack.slice(0, pos);
    return haystack;
  }

  private extractActions = (body) => {
    const objResult = actionsObjRegexp.exec(body);
    const funcResult = actionsFuncRegexp.exec(body);
    if (!objResult || !funcResult) { return null; }

    const obj = objResult[1].replace(/\$/g, '\\$');
    const objBody = objResult[2].replace(/\$/g, '\\$');
    const funcBody = funcResult[1].replace(/\$/g, '\\$');

    let result = reverseRegexp.exec(objBody);
    const reverseKey = result && result[1]
      .replace(/\$/g, '\\$')
      .replace(/\$|^'|^"|'$|"$/g, '');
    result = sliceRegexp.exec(objBody);
    const sliceKey = result && result[1]
      .replace(/\$/g, '\\$')
      .replace(/\$|^'|^"|'$|"$/g, '');
    result = spliceRegexp.exec(objBody);
    const spliceKey = result && result[1]
      .replace(/\$/g, '\\$')
      .replace(/\$|^'|^"|'$|"$/g, '');
    result = swapRegexp.exec(objBody);
    const swapKey = result && result[1]
      .replace(/\$/g, '\\$')
      .replace(/\$|^'|^"|'$|"$/g, '');

    const keys = `(${[reverseKey, sliceKey, spliceKey, swapKey].join('|')})`;
    const myreg = '(?:a=)?' + obj +
      `(?:\\.${keys}|\\['${keys}'\\]|\\["${keys}"\\])` +
      '\\(a,(\\d+)\\)';
    const tokenizeRegexp = new RegExp(myreg, 'g');
    const tokens = [];
    while ((result = tokenizeRegexp.exec(funcBody)) !== null) {
      const key = result[1] || result[2] || result[3];
      switch (key) {
        case swapKey:
          tokens.push('w' + result[4]);
          break;
        case reverseKey:
          tokens.push('r');
          break;
        case sliceKey:
          tokens.push('s' + result[4]);
          break;
        case spliceKey:
          tokens.push('p' + result[4]);
          break;
      }
    }
    return tokens;
  }

  private async getTokens(html5playerfile, options?: any) {
    let key, cachedTokens;
    const rs = /(?:html5)?player[-_]([a-zA-Z0-9\-_]+)(?:\.js|\/)/
      .exec(html5playerfile);
    if (rs) {
      key = rs[1];
      cachedTokens = this.cache.get(key);
    } else {
      console.warn('Could not extract html5player key:', html5playerfile);
    }
    if (cachedTokens) {
      return cachedTokens;

    } else {
      const response = await this.proxyFetch.fetch(html5playerfile);
      const body = await response.text();

      const tokens = this.extractActions(body);
      if (key && (!tokens || !tokens.length)) {
        throw (new Error('Could not extract signature deciphering actions'));
      }

      this.cache.set(key, tokens);
      return tokens;
    }
  }

  private async gotConfig(url, config) {

    config = JSON.parse(config);
    const videoUrl = new URL(url);
    const id = videoUrl.searchParams.get('v');
    const infoUrl = new URL(url);
    infoUrl.pathname = 'get_video_info';
    infoUrl.search = new URLSearchParams({
      video_id: id,
      eurl: 'https://youtube.googleapis.com/v/' + id,
      ps: 'default',
      gl: 'US',
      hl: 'en',
      sts: config.sts
    }).toString();
    const infoResponse = await this.proxyFetch.fetch(infoUrl.href);
    const body = await infoResponse.text();

    const info: any = {};
    (new URLSearchParams(body)).forEach((value, key) => {
      info[key] = value;
    });

    const player_response = config.args.player_response || info.player_response;
    info.player_response = JSON.parse(player_response);

    [
      'fmt_list',
      'fexp',
      'watermark'
    ].forEach((key) => {
      if (!info[key]) { return; }
      info[key] = info[key]
        .split(',')
        .filter((v) => v !== '');
    });

    info.formats = this.parseFormats(info);

    info.fmt_list = info.fmt_list ?
      info.fmt_list.map((format) => format.split('/')) : [];

    info.html5player = config.assets.js;

    return info;
  }


  public async getMetadata(url: string) {
    const params = 'en';
    const youtubeResponse = await this.proxyFetch.fetch(url);
    const html = await youtubeResponse.text();
    const unavailableMsg = this.between(html, '<div id="player-unavailable"', '>');
    if (unavailableMsg &&
      !/\bhid\b/.test(this.between(unavailableMsg, 'class="', '"'))) {
      // Ignore error about age restriction.
      if (!html.includes('<div id="watch7-player-age-gate-content"')) {
        throw (new Error(this.between(html,
          '<h1 id="unavailable-message" class="message">', '</h1>').trim()));
      }
    }

    const jsonStr = this.between(html, 'ytplayer.config = ', '</script>');
    const config = jsonStr.slice(0, jsonStr.lastIndexOf(';ytplayer.load'));
    const metadata = await this.gotConfig(url, config);
    const tokens = await this.getTokens(`https://www.youtube.com${metadata.html5player}`);
    this.decipherFormats(metadata.formats, tokens);
    metadata.formats.forEach(this.addFormatMeta);
    console.log(metadata.formats);
    metadata.formats = metadata
      .formats
      .filter(format => format.container === 'mp4' && format.audioBitrate !== null)
      .map(format => {
        format.label = format.resolution;
        return format;
      });
    metadata.formats.sort(this.sortFormats);
    console.log(metadata.formats);
    metadata.full = true;
    const oUrl = new URL(url);
    metadata.filename = oUrl.searchParams.get('v') + '.mp4';

    return metadata;


  }

  public async download(url: string) {

    try {
      const metadata = await this.getMetadata(url);
      const format = metadata.formats[0];
      const content = await this.proxyFetch.fetch(format.url);
      return {
        content: await content.blob(),
        metadata: {
          isVideo: true,
          mimeType: 'string',
          filename: 'string',
          formats: metadata.formats,
        }
      };
    } catch (e) {
      console.log(e);
    }
  }
}
