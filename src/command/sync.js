import _ from 'underscore';
import Config, { servers } from '../config'
import DB from '../database';
import Downloader from '../downloader';
import { all } from '../async-api';
import inquirer from 'inquirer';
import pace from 'pace';

async function sync(db, id, version, from, to, force) {
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
  let len = 0;
  let bar = pace(1);
  let downloader = new Downloader();
  let failedCount = 0;
  await all(volumes, async (volume) => {
    let volumeData = await crawler.browse(volume.url);
    len += volumeData.pages.length;
    bar.total = len;

    volumeData.name = volume.title;
    volumeData.version = result.versions[version].version;
    volumeData.managId = result.id;
    volumeData.mangaUrl = result.url;

    volumeData._id = volumeData.url;
    await db.updateVolume(volumeData);

    await all(volumeData.pages, async (imageUrl,index) => {
      let imageData = await db.findImage(imageUrl);
      if (!force && imageData.length > 0) {
        bar.op();
        return;
      }
      try {
        imageData = await downloader.get(imageUrl, {
          referer: volume.url,
          retry: 5,
        });
      } catch (e) {
        console.error(e.message);
        bar.op();
        failedCount++;
        return;
      }
      bar.op();
      imageData.volumeTitle = volume.title;
      imageData.volumeUrl = volume.url;
      imageData.mangaId = result.id;
      imageData.mangaUrl = result.url;
      imageData.pageNumber = index + 1;

      imageData._id = imageData.url;
      await db.updateImage(imageData);
    });
  });

  if (failedCount > 0)
    console.error('有' + failedCount + '张图片下载失败，请手动重试');
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
    force: {
      type: 'boolean',
      alias: 'f',
      default: false,
      describe: '强制下载',
    },
  },
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.get('database');
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.db_name);
    await all(_.map(argv._.slice(1),
      (id) => sync(db, id, argv.version, argv.from, argv.to, argv.force)));
    await db.disconnect();
  }
}
