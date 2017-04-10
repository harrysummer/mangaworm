import _ from 'underscore';
import Config, { servers } from '../config'
import DB from '../database';
import Downloader from '../downloader';
import { all } from '../async-api';
import inquirer from 'inquirer';

async function sync(db, id, version, from, to) {
  let ret = /^([^\/]+)\/(.*)$/.exec(id);
  if (ret == null) {
    throw new Error('Id "' + id + '" is invalid.');
  }
  let repo = ret[1];
  let name = ret[2];
  if (!(repo in servers)) {
    throw new Error('Server "' + repo + '" is not available');
  }
  let crawler = new servers[repo]();
  let result = await crawler.query(crawler.id2url(id));

  // Get the correct version
  if (typeof version == 'number') {
    if (version <= 0 || result.versions.length < version)
      throw new Error('Version out of range');
    version--;
  } else {
    for (let i = 0; i < result.versions.length; i++) {
      if (version == result.versions[i].version) {
        version = i;
        break;
      }
    }
    if (typeof version != 'number')
      throw new Error('Version not found');
  }

  // Volume selection
  let volumes = result.versions[version].episodes;
  if (from > 0)
    from--;
  if (to < 0)
    to++;
  if (to == 0)
    to = volumes.length;
  volumes = volumes.slice(from, to);

  // User confirmation
  console.log('即将同步以下' + volumes.length + '卷漫画：');
  volumes.forEach((item) => console.log(item.title));
  var answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: '请确认是否继续?'
    }
  ]);
  if (!answer.continue)
    return;

  result._id = result.id;
  await db.updateManga(result);

  // server.browse
  let downloader = new Downloader();
  await all(volumes, async (volume) => {
    let volumeData = await crawler.browse(volume.url);
    volumeData.name = volume.title;
    volumeData.version = result.versions[version].version;
    volumeData.managId = result.id;
    volumeData.mangaUrl = result.url;

    volumeData._id = volumeData.url;
    await db.updateVolume(volumeData);

    await all(volumeData.pages, async (imageUrl,index) => {
      let imageData = await downloader.get(imageUrl, {
        referer: volume.url,
        retry: 1,
      });
      imageData.volumeTitle = volume.title;
      imageData.volumeUrl = volume.url;
      imageData.mangaId = result.id;
      imageData.mangaUrl = result.url;
      imageData.pageNumber = index + 1;

      imageData._id = imageData.url;
      await db.updateImage(imageData);
    });
  });

}

export default {
  command: 'sync',
  describe: 'Sync manga from online to local',
  builder: {
    version: {
      type: 'string',
      alias: 'b',
      default: 'default',
      describe: '要下载的漫画版本',
    },
    from: {
      type: 'number',
      alias: 'f',
      default: 0,
      describe: '起始编号',
    },
    to: {
      type: 'number',
      alias: 't',
      default: 0,
      describe: '结束编号',
    },
  },
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.get('database');
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.db_name);
    await all(_.map(argv._.slice(1),
      (id) => sync(db, id, argv.version, argv.from, argv.to)));
    await db.disconnect();
  }
}
