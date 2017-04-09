import request from 'request-promise-native';
import errors from 'request-promise-native/errors';

export default class Downloader {
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
        data = await request(opt);
      } catch (e) {
        if (e instanceof errors.StatusCodeError && i < nIters - 1) {
          console.error(e.message + ' Retrying ' + url);
          continue;
        } else {
          throw e;
        }
      }
      console.log(data.statusCode);
      console.log(data.headers);
      return data.body;
    }
  }
}
