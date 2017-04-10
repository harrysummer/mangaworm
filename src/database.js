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
    if (!'db' in this)
      throw new Error('No database connected.');

    let collection = await this.db.createCollection('manga');
    await collection.replaceOne({_id: data._id}, data, {upsert: true});
  }

  async updateVolume(data) {
    if (!'db' in this)
      throw new Error('No database connected.');

    let collection = await this.db.createCollection('volume');
    await collection.replaceOne({_id: data._id}, data, {upsert: true});
  }

  async updateImage(data) {
    if (!'db' in this)
      throw new Error('No database connected.');
    data.data = new mongodb.Binary(Buffer.from(data.data, 'binary'));
    let collection = await this.db.createCollection('image');
    collection.replaceOne({_id: data._id}, data, {upsert: true});
  }

  async findManga(id) {
    return await this.db.collection('manga').find({}).toArray();
  }
}
