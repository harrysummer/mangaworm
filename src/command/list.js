import colors from 'ansi-256-colors'
import DB from '../database';
import Config from '../config';

async function list(db, raw) {
  let manga = await db.findManga();
  if (raw) {
    console.log(manga);
    return;
  }
  manga.forEach((item) => {
    console.log(colors.fg.bright[2] + item.id + colors.reset);
    console.log(colors.fg.bright[4] + item.title + '\t'
      + colors.fg.standard[4] + item.author
      + (item.complete ? ' ' +
        colors.fg.bright[1] + "已完结" : '')
      + colors.reset);
  });
}

export default {
  command: 'list',
  describe: 'List local manga books',
  builder: {
    raw: {
      type: 'boolean',
      alias: 'r',
    },
  },
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.parse();
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.database);
    await list(db, argv.raw);
    await db.disconnect();
  },
};
