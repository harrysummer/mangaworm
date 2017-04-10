import yazl from 'yazl';
import buffer from 'buffer';
import fs from 'fs';
import Config, { servers } from '../config'
import DB from '../database';
import inquirer from 'inquirer';
import util from 'util';
import pace from 'pace';

async function exportBook(id, db, version, from, to, output) {
  let manga = await db.findManga(id);
  if (manga.length == 0) {
    throw new Error('Manga not found in local database');
  }
  manga = manga[0];

  // Get the correct version
  if (typeof version == 'number') {
    if (version <= 0 || manga.versions.length < version)
      throw new Error('Version out of range');
    version--;
  } else {
    for (let i = 0; i < manga.versions.length; i++) {
      if (version == manga.versions[i].version) {
        version = i;
        break;
      }
    }
    if (typeof version != 'number')
      throw new Error('Version not found');
  }

  // Volume selection
  let volumes = manga.versions[version].episodes;
  if (from > 0)
    from--;
  if (to < 0)
    to++;
  if (to == 0)
    to = volumes.length;
  volumes = volumes.slice(from, to);

  // User confirmation
  console.log('即将导出以下' + volumes.length + '卷漫画：');
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

  let zipfile = new yazl.ZipFile();
  zipfile.outputStream.pipe(fs.createWriteStream(output)).on('close',
    () => console.log('Done'));

  let len = 0;
  for (let item of volumes) {
    let volume = await db.findVolume(item.url);
    len += volume[0].pages.length;
  }
  if (len == 0)
    throw new Error('Empty selection!');
  let bar = pace(len);
  let padToFour = number => number <= 9999 ? ("000"+number).slice(-4) : number;
  for (let item of volumes) {
    let volume = await db.findVolume(item.url);
    for (let imageUrl of volume[0].pages) {
      let image = await db.findImage(imageUrl);
      bar.op();
      image = image[0];
      let entry = image.volumeTitle + "/page_" + padToFour(image.pageNumber) + ".jpg";
      let buf= buffer.Buffer.from(image.data.value(), 'binary');
      zipfile.addBuffer(buf, entry);
    }
  }
  zipfile.end();
}

export default {
  command: 'export <manga_id>',
  describe: 'Export manga book to PDF or CBZ format',
  builder: {
    version: {
      type: 'string',
      alias: 'b',
      default: 'default',
      describe: '要导出的漫画版本',
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
    output: {
      type: 'string',
      alias: 'o',
      describe: '保存文件名',
      demandOption: true,
    }
  },
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.get('database');
    let db = new DB();
    await db.connect(conf.server_name, conf.server_port, conf.db_name);
    await exportBook(argv.manga_id, db, argv.version, argv.from, argv.to, argv.output);
    await db.disconnect();
  }
};
