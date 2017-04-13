import vm from 'vm';
import util from 'util';
import Xray from 'x-ray';
import makeDriver from 'request-x-ray';
import request from 'request';
import rp from 'request-promise-native';
import Bottleneck from 'bottleneck';
import _ from 'underscore';
import {promisify,promisifyCallback} from '../async-api';

let limiter = new Bottleneck(5, 100);

let x = Xray({
  filters: {
    trim: (value) => typeof value === 'string' ? value.trim() : value,
    stripZhBracket: (value) => typeof value === 'string' && /^（(.*)）$/.exec(value) !== null ? /^（(.*)）$/.exec(value)[1] : value,
  }
});
x.concurrency(5);
x.throttle(1, 100);

export default class {
  constructor() {
    this.ID_PREFIX = 'dm5/'
    this.URL_PREFIX = 'http://www.dm5.com';
    this.SEARCH_PAGE_PREFIX = this.URL_PREFIX + '/search?title=';
    this.MANGA_PAGE_PREFIX = this.URL_PREFIX + '/manhua-';
    this.IMAGE_QUERY_TEMPLATE = this.URL_PREFIX + '%schapterfun.ashx?cid=%d&page=%d&key=%s&language=1&gtk=6';
  }

  url2id(url) {
    let id = /^http:\/\/www\.dm5\.com\/manhua-(.*)\/$/.exec(url);
    if (id === null)
      throw new Error('Url error: ' + url);
    return this.ID_PREFIX + id[1];
  }

  id2url(id) {
    if (!id.startsWith(this.ID_PREFIX))
      throw new Error('ID error: ' + id);
    return this.MANGA_PAGE_PREFIX + id.substr(this.ID_PREFIX.length) + '/';
  }

  async search(keyword) {
    x.driver(makeDriver(request.defaults()));
    let url = this.SEARCH_PAGE_PREFIX + encodeURIComponent(keyword);
    let data = await promisifyCallback(x(
      url, '.midBar .item',
      [{
        title: 'dt>p>a.title | trim',
        author: 'dt>span:contains("作者")~a.value | trim',
        thumbnail: 'dl img[src]@src',
        url: 'dl>a[href]@href',
        status: 'dt>p>span.date>span.red | trim | stripZhBracket',
      }]
    ));
    data.forEach((item) => {
      item.id = this.url2id(item.url);
    });
    return data;
  }

  async query(url) {
    x.driver(makeDriver(request.defaults()));
    let data = await promisifyCallback(x(
      url,
      '#index_left',
      {
        title: 'h1.new_h2 | trim',
        cover: '.innr91 img@src',
        author: 'span.innr92_m:contains("作者") a | trim',
        region: '.span.innr92_s:contains("地区") a | trim',
        status: 'span.innr92_m:contains("状态") a | trim',
        popularity: '.span.innr92_s:contains("人气") a | trim',
        theme: 'span.innr92_m:contains("类型") a | trim',
        update: 'span.innr92_m:contains("最新章节") a | trim',
        detail: '.mhjj p | trim',
        episodes: x(
          'ul[id^=cbc_]>li',
          [{
            title: 'a@title',
            url: 'a@href'
          }]),
      }));

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
    let html = await promisifyCallback(x(url, 'body@html'));
    let script = await promisifyCallback(x(html, 'script:contains("DM5_CID")'));
    const sandbox = { reseturl: () => {}, window: { location: {} } };
    vm.runInNewContext(script, sandbox);
    const volumePath = sandbox.DM5_CURL;
    const volumeId = sandbox.DM5_CID;
    const nPages = sandbox.DM5_IMAGE_COUNT;
    const key = await promisifyCallback(x(html, "#dm5_key@value"));

    let pages = new Array(nPages);
    for (let i = 0; i < nPages; i++) {
      if (pages[i] === undefined) {
        let reqUrl = util.format(this.IMAGE_QUERY_TEMPLATE, volumePath, volumeId, i+1, key);
        let opt = {
          uri: reqUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
            'Referer': url,
          },
          simple: true,
          resolveWithFullResponse: true,
          gzip: true,
          encoding: 'binary',
          agentOptions: {
            forever: true,
          }
        };
        let jsCode = await promisify(limiter.submit)(rp, opt);

        let urls = vm.runInNewContext(jsCode.body);
        for (let j = 0; j < urls.length; j++) {
          pages[i + j] = urls[j];
        }
      }
    }

    return { url: url, pageCount: nPages, pages: pages };
  }
};
