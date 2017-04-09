import bluebird from 'bluebird';
import fsSync from 'fs';
import mkdirpSync from 'mkdirp';
import mongodbSync from 'mongodb';

export let fs = bluebird.promisifyAll(fsSync);
fs.mkdirpAsync = bluebird.promisify(mkdirpSync);

export const mongodb = bluebird.promisifyAll(mongodbSync);

export const promisify = bluebird.promisify;
export const promisifyCallback = bluebird.fromCallback;
