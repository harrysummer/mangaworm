import request from 'request-promise-native';
import errors from 'request-promise-native/errors';
import Bottleneck from 'bottleneck';
import {promisify} from './async-api';

let limiter = new Bottleneck(5, 100);

export default class Downloader {
  constructor() {
  }

  async get(url, options) {
    let header = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko', /* IE 11 on Windows 10 */
    };
    if ('userAgent' in options)
      header['User-Agent'] = options.userAgent;
    if ('referer' in options)
      header['Referer'] = options.referer;

    let opt = {
      uri: url,
      headers: header,
      simple: true,
      resolveWithFullResponse: true,
      gzip: true,
      encoding: 'binary',
      agentOptions: {
        forever: true,
      }
    };

    let nIters = 'retry' in options ? options.retry : 5;
    let data = null;

    for (let i = 0; i < nIters; i++) {
      try {
        data = await promisify(limiter.submit)(request, opt);
      } catch (e) {
        if (e instanceof errors.StatusCodeError && i < nIters - 1) {
          console.error(e.message + ' Retrying ' + url);
          continue;
        } else {
          throw e;
        }
      }
      if (data.headers['content-length'] != data.body.length) {
        console.error('Download incomplete');
        continue;
      }
      return {
        url: url,
        type: data.headers['content-type'],
        data: data.body,
      };
    }
  }
}
