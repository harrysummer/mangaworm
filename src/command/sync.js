import _ from 'underscore';
import Config, { servers } from '../config'
import DB from '../database';
import { all } from '../async-api';

async function sync(db, id) {
  let ret = /^([^\/]+)\/(.*)$/.exec(id);
  if (ret == null) {
    throw new Error('Id "' + id + '" is invalid.');
  }
  let repo = ret[1];
  let name = ret[2];
  if (!repo in servers) {
    throw new Error('Server "' + repo + '" is not available');
  }
  let crawler = new servers[repo]();
  let result = await crawler.query(name);
  await db.addManga(result);
}

export default {
  command: 'sync',
  describe: 'Sync manga from online to local',
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.parse();
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.database);
    await all(_.map(argv._.slice(1), (id) => sync(db, id)));
    await db.disconnect();
  }
}
