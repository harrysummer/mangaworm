import vm from 'vm';
import Xray from 'x-ray';
import makeDriver from 'request-x-ray';
import request from 'request';
import util from 'util';
import _ from 'underscore';
import { promisify,promisifyCallback } from '../async-api';
import Bottleneck from 'bottleneck';

let limiter = new Bottleneck(5, 100);

let x = Xray({
  filters: {
    trim: (value) => typeof value === 'string' ? value.trim() : value,
    https2http: (value) => typeof value === 'string' ? value.replace(/^https:/, 'http:') : value,
    largeImage: (value) => typeof value === 'string' ? value.replace(/\/\d+$/, '/0') : value,
    stripBracket: (value) => typeof value === 'string' && /^\[(.*)\]$/.exec(value) !== null ? /^\[(.*)\]$/.exec(value)[1] : value,
  }
});
x.concurrency(5);
x.throttle(1, 100);

export default class {
  constructor() {
    this.ID_PREFIX = 'tencent/';
    this.SEARCH_PAGE_PREFIX = 'http://ac.qq.com/Comic/searchList/search/';
    this.MANGA_PAGE_PREFIX = 'http://ac.qq.com/Comic/comicInfo/id/';
  }

  url2id(url) {
    let id = /^http:\/\/ac\.qq\.com\/Comic\/comicInfo\/id\/(\d+)$/.exec(url);
    if (id === null)
      throw new Error('Url error: ' + url);
    return this.ID_PREFIX + id[1];
  }

  id2url(id) {
    if (!id.startsWith(this.ID_PREFIX))
      throw new Error('ID error: ' + id);
    return this.MANGA_PAGE_PREFIX + id.substr(this.ID_PREFIX.length);
  }

  async search(keyword) {
    x.driver(makeDriver(request.defaults()));
    let html = await promisifyCallback(x(
      this.SEARCH_PAGE_PREFIX + encodeURIComponent(keyword), 'body@html'));
    let notfound = await promisifyCallback(x(html, '.mod_960wr', {text:'span'}));
    if ('text' in notfound)
      return [];

    let data = await promisifyCallback(x(
      html, 'ul.mod_book_list>li',
      [{
        title: 'h4.mod_book_name a[title]@title | trim',
        thumbnail: 'a.mod_book_cover img[data-original]@data-original | https2http | largeImage',
        url: 'a.mod_book_cover[href]@href',
        status: 'h3.mod_book_update | trim',
      }]
    ));
    data.forEach((item) => {
      item.id = this.url2id(item.url);
    });
    return data;
  }

  async query(url) {
    x.driver(makeDriver(request.defaults()));
    let html = await promisifyCallback(x(url, 'body@html'));
    let data = await promisifyCallback(x(
      html,
      '#J_403_msg'));
    if (data.length > 0)
      throw new Error(data);

    data = await promisifyCallback(x(
      html,
      '#special_bg',
      {
        title: 'h2.works-intro-title | trim',
        cover: '.works-cover img[src]@src',
        author: 'a.works-author-name | trim',
        status: 'label.works-intro-status | trim',
        popularity: 'p.works-intro-digi span:contains("人气") em | trim',
        theme: ['div[style="display:none"] a[href*="theme"]@title'],
        update: 'a.works-ft-new | trim | stripBracket',
        detail: 'p.works-intro-short | trim',
        episodes: x(
          'ol.chapter-page-all span.works-chapter-item',
          [{
            title: 'a@title',
            url: 'a@href'
          }]
        ),
      }
    ));

    data.id = this.url2id(url);
    data.url = url;
    data.blocked = false;
    data.versions = [{
      version: 'default',
      episodes: 'episodes' in data ? data.episodes : []
    }];
    delete data.episodes;
    return data;
  }

  async browse(url) {
    x.driver(makeDriver(request.defaults()));
    let data = await promisifyCallback(x(
      url,
      'body script:contains("DATA")'));
    const sandbox = {
    };
    vm.runInNewContext(data, sandbox);
    vm.runInNewContext('function Base(){_keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";this.decode=function(c){var a="",b,d,h,f,g,e=0;for(c=c.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");e<c.length;)b=_keyStr.indexOf(c.charAt(e++)),d=_keyStr.indexOf(c.charAt(e++)),f=_keyStr.indexOf(c.charAt(e++)),g=_keyStr.indexOf(c.charAt(e++)),b=b<<2|d>>4,d=(d&15)<<4|f>>2,h=(f&3)<<6|g,a+=String.fromCharCode(b),64!=f&&(a+=String.fromCharCode(d)),64!=g&&(a+=String.fromCharCode(h));return a=_utf8_decode(a)};_utf8_decode=function(c){for(var a="",b=0,d=c1=c2=0;b<c.length;)d=c.charCodeAt(b),128>d?(a+=String.fromCharCode(d),b++):191<d&&224>d?(c2=c.charCodeAt(b+1),a+=String.fromCharCode((d&31)<<6|c2&63),b+=2):(c2=c.charCodeAt(b+1),c3=c.charCodeAt(b+2),a+=String.fromCharCode((d&15)<<12|(c2&63)<<6|c3&63),b+=3);return a}}var B=new Base;DATA=(new Function("return "+B.decode(DATA.substring(1))))()', sandbox);
    let pages = _.map(sandbox.DATA.picture, (item) => item.url);
    return {
      url: url,
      pageCount: pages.length,
      pages: pages
    };
  }
}
