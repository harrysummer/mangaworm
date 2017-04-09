import bluebird from 'bluebird';
import fsSync from 'fs';
import mkdirpSync from 'mkdirp';
import _ from 'underscore';

export let fs = bluebird.promisifyAll(fsSync);
fs.mkdirpAsync = bluebird.promisify(mkdirpSync);

export const promisify = bluebird.promisify;
export const promisifyCallback = bluebird.fromCallback;
export const awaitAll = async (arr, cb) =>
  await bluebird.all(
    _.map(arr, (value,key) => cb(value,key)));
