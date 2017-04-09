import util from 'util';
import { mongodb } from './async-api';

export default class MangaDB {
  constructor() {
    this.client = db.MongoClient;
  }

  connect(server_name, server_port, db_name) {
    this.url = util.format('mongodb://%s:%d/%s',
      server_name, server_port, db_name);
    //return this.client.connect(url
  }
}
