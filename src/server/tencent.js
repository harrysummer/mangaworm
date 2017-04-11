import Xray from 'x-ray';
import makeDriver from 'request-x-ray';
import request from 'request';
import util from 'util';
import _ from 'underscore';
import { promisifyCallback } from '../async-api';

let x = Xray({
  filters: {
    trim: (value) => typeof value === 'string' ? value.trim() : value,
    https2http: (value) => typeof value === 'string' ? value.replace(/^https:/, 'http:') : value,
    largeImage: (value) => typeof value === 'string' ? value.replace(/\/\d+$/, '/0') : value,
  }
});

export default class {
  constructor() {
    this.ID_PREFIX = 'tecent/';
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
}
