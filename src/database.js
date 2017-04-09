import util from 'util';
import mongodb from 'mongodb';
import { promisify } from '../async-api';

export default class MangaDB {
  constructor() {
    this.client = mongodb.MongoClient;
  }

  async connect(server_name, server_port, db_name) {
    this.url = util.format('mongodb://%s:%d/%s',
      server_name, server_port, db_name);
    this.db = await promisify(this.client.connect)(this.url);
  }
}
