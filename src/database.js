import util from 'util';
import buffer from 'buffer';
import mongodb from 'mongodb';

export default class MangaDB {
  constructor() {
    this.client = new mongodb.MongoClient();
  }

  async connect(server_name, server_port, db_name) {
    this.url = util.format('mongodb://%s:%d/%s',
      server_name, server_port, db_name);
    this.db = await this.client.connect(this.url);
  }

  async disconnect() {
    if ('db' in this)
      await this.db.close();
    delete this.db;
  }

  async updateManga(data) {
    if (!('db' in this))
      throw new Error('No database connected.');

    await this.db.collection('manga').replaceOne({_id: data._id}, data, {upsert: true});
  }

  async updateVolume(data) {
    if (!('db' in this))
      throw new Error('No database connected.');

    await this.db.collection('volume').replaceOne({_id: data._id}, data, {upsert: true});
  }

  async updateImage(data) {
    if (!('db' in this))
      throw new Error('No database connected.');
    data.data = new mongodb.Binary(Buffer.from(data.data, 'binary'));
    await this.db.collection('image').replaceOne({_id: data._id}, data, {upsert: true});
  }

  async findManga(id) {
    let query = {};
    if (id !== undefined)
      query._id = id;
    return await this.db.collection('manga').find(query).toArray();
  }

  async findVolume(url) {
    let query = {_id: url};
    return await this.db.collection('volume').find(query).toArray();
  }

  async findImage(url) {
    let query = {_id: url};
    return await this.db.collection('image').find(query).toArray();
  }

  async removeManga(filter) {
    return await this.db.collection('manga').deleteMany(filter);
  }

  async removeVolume(filter) {
    this.db.collection('volume').createIndex('mangaId');
    return await this.db.collection('volume').deleteMany(filter);
  }

  async removeImage(filter) {
    this.db.collection('image').createIndex('mangaId');
    return await this.db.collection('image').deleteMany(filter);
  }

  async countManga(filter) {
    return await this.db.collection('manga').count(filter);
  }

  async countVolume(filter) {
    this.db.collection('volume').createIndex('mangaId');
    return await this.db.collection('volume').count(filter);
  }

  async countImage(filter) {
    this.db.collection('image').createIndex('mangaId');
    return await this.db.collection('image').count(filter);
  }
}
