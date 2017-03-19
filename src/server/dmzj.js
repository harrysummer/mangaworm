import Xray from 'x-ray';
import makeDriver from 'request-x-ray';
import Promise from 'bluebird';
import request from 'request';
import _ from 'underscore';

let x = Xray({
  filters: {
    trim: (value) => typeof value === 'string' ? value.trim() : value
  }
});

export default class {
  constructor() {
    this.ID_PREFIX = 'dmzj/'
    this.VOLUME_PAGE_PREFIX = 'http://manhua.dmzj.com/';
  }

  getUrl(id) {
    return this.VOLUME_PAGE_PREFIX + id;
  }

  search(keyword) {
    const driver = makeDriver({
      method: 'POST',
      form: { keywords: keyword },
    });
    x.driver(driver);
    return Promise.fromCallback(x(
        'https://www.dmzj.com/dynamic/o_search/index',
        '.wrap_list_con li',
        [{
          title: 'p a[title] | trim',
          author: 'p.auth | trim',
          thumbnail: 'a img[src]@src',
          url: 'a[href]@href',
          complete: 'p.over_comic',
        }]))
    .then((data) => {
      data.forEach((item) => {
        let id = /^https?:\/\/manhua\.dmzj\.com\/(.*)$/.exec(item.url);
        if (id === null)
          id = /^https?:\/\/www\.dmzj\.com\/info\/(.*)\.html$/.exec(item.url);
        if (id === null)
          return Promise.reject(new Error('Url error: ' + item.url));
        id = id[1];
        delete item.url;
        item.id = this.ID_PREFIX + id;

        if ('complete' in item)
          item.complete = true;
        else
          item.complete = false;
      });
      return data;
    });
  }

  query(id) {
    let url = this.getUrl(id);
    console.log(url);
    x.driver(makeDriver(request.defaults()));
    return Promise.fromCallback(x(
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
      }))
    .then((data) => {
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
    });
  }
};
