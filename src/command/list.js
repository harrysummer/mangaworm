import colors from 'ansi-256-colors'
import DB from '../database';
import Config from '../config';

async function list(db, raw) {
  let manga = await db.findManga();
  if (raw) {
    console.log(manga);
    return;
  }
  for (let item of manga) {
    let volumeCount = await db.countVolume({mangaId: item._id});
    let imageCount = await db.countImage({mangaId: item._id});
    console.log(colors.fg.bright[2] + item.id + colors.reset + '\t'
      + colors.fg.bright[4] + ' ' + item.title
      + colors.fg.standard[4] + ' ' + item.author
      + (item.complete ? ' ' + colors.fg.bright[1] + "已完结" : '')
      + colors.reset);
    console.log('\t已下载：' + volumeCount + '卷，共计' + imageCount + '张图片');
  }
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
    let conf = await config.get('database');
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.db_name);
    await list(db, argv.raw);
    await db.disconnect();
  },
};
