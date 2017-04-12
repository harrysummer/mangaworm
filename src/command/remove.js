import DB from '../database';
import Config from '../config'
import {all} from '../async-api';
import _ from 'underscore';

async function remove(db, id) {
  await db.removeImage({mangaId:id});
  await db.removeVolume({mangaId:id});
  await db.removeManga({_id:id});
}

export default {
  command: 'remove',
  describe: 'Remove manga from local storage.',
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.get('database');
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.db_name);
    await all(_.map(argv._.slice(1),
      async (id) => await remove(db, id)));
    await db.disconnect();
  }
}
