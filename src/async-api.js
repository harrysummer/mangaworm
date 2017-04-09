import bluebird from 'bluebird';
import fsSync from 'fs';
import mkdirpSync from 'mkdirp';
import _ from 'underscore';

export let fs = bluebird.promisifyAll(fsSync);
fs.mkdirpAsync = bluebird.promisify(mkdirpSync);

export const promisify = bluebird.promisify;
export const promisifyCallback = bluebird.fromCallback;
export const all = async (arr, asyncFunc) =>
  await bluebird.all(asyncFunc === undefined ?
    arr :
    _.map(arr, (value,key) => asyncFunc(value,key)));
