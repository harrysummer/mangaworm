import vm from 'vm';
import util from 'util';
import Xray from 'x-ray';
import makeDriver from 'request-x-ray';
import request from 'request';
import _ from 'underscore';
import { promisifyCallback } from '../async-api';

let x = Xray({
  filters: {
    trim: (value) => typeof value === 'string' ? value.trim() : value
  }
});

export default class {
  constructor() {
    this.ID_PREFIX = 'dmzj/'
    this.MANGA_PAGE_PREFIX = 'http://manhua.dmzj.com/';
    this.IMAGE_PREFIX = 'http://images.dmzj.com/';
  }

  url2id(url) {
    let id = /^https?:\/\/manhua\.dmzj\.com\/(.*)$/.exec(url);
    if (id === null)
      id = /^https?:\/\/www\.dmzj\.com\/info\/(.*)\.html$/.exec(url);
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
    const driver = makeDriver({
      method: 'POST',
      form: { keywords: keyword },
    });
    x.driver(driver);
    let data = await promisifyCallback(x(
        'https://www.dmzj.com/dynamic/o_search/index',
        '.wrap_list_con li',
        [{
          title: 'p a[title] | trim',
          author: 'p.auth | trim',
          thumbnail: 'a img[src]@src',
          url: 'a[href]@href',
          complete: 'p.over_comic',
        }]));

    data.forEach((item) => {
      item.id = this.url2id(item.url);
      if ('complete' in item)
        item.complete = true;
      else
        item.complete = false;
    });
    return data;
  }

  async query(url) {
    x.driver(makeDriver(request.defaults()));
    let data = await promisifyCallback(x(
      url,
      '.wrap',
      {
        title: 'h1 | trim',
        cover: '.anim_intro_ptext a[href] img@src',
        author: '.anim-main_list table th:contains("作者") + td | trim',
        region: '.anim-main_list table th:contains("地域") + td | trim',
        status: '.anim-main_list table th:contains("状态") + td | trim',
        popularity: '.anim-main_list table th:contains("人气") + td | trim',
        theme: '.anim-main_list table th:contains("题材") + td | trim',
        category: '.anim-main_list table th:contains("分类") + td | trim',
        update: '.anim-main_list table th:contains("最新收录") + td | trim',
        detail: '.photo_part:contains("详细介绍") + .line_height_content | trim',
        blocked: 'img[src$="/4004.gif"]@src',
        episodes: x(
          '.photo_part:contains("在线漫画全集") ~ .cartoon_online_border li',
          [{
            title: 'a@title',
            url: 'a@href'
          }]),
        otherVersions: [ '.photo_part:contains("漫画其它版本") | trim' ],
        otherVersionEpisodes: x(
          '.photo_part:contains("漫画其它版本") + .cartoon_online_border_other',
          [{
            episodes: x('li', [{
              title: 'a@title',
              url: 'a@href'
            }])
          }]),
      }));

    data.id = this.url2id(url);
    data.url = url;
    data.blocked = 'blocked' in data;
    if (!data.blocked) {
      data.versions = [{
        version: 'default',
        episodes: 'episodes' in data ? data.episodes : []
      }];
      delete data.episodes;

      if ('otherVersions' in data) {
        data.otherVersions.forEach((v, i, arr) => arr[i] = /.*：(.*)/.exec(v)[1]);
        let temp = _.zip(data.otherVersions, data.otherVersionEpisodes);
        temp.forEach((v,i,arr) => {
          arr[i] = _.object(['version', 'episodes'], v);
          arr[i].episodes = arr[i].episodes.episodes;
        });
        data.versions = data.versions.concat(temp);
        delete data.otherVersions;
        delete data.otherVersionEpisodes;
      }
    }
    return data;
  }

  async browse(url) {
    x.driver(makeDriver(request.defaults()));
    let data = await promisifyCallback(x(
      url,
      'head script:contains("arr_pages")'));
    const sandbox = { res_id: "", chapter_id: "" };
    vm.runInNewContext(data, sandbox);
    return _.object(
      ['url', 'pageCount', 'pages'],
      [
        url,
        sandbox.g_max_pic_count,
        _.map(sandbox.arr_pages, (s) => this.IMAGE_PREFIX + s)
      ]);
  }
};
