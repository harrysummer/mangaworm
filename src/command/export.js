import yazl from 'yazl';
import buffer from 'buffer';
import fs from 'fs';
import path from 'path';
import Config, { servers } from '../config'
import DB from '../database';
import inquirer from 'inquirer';
import util from 'util';
import pace from 'pace';
import PDFDocument from 'pdfkit';
import sizeOf from 'image-size';

const FORMAT_UNKNOWN = 0;
const FORMAT_CBZ = 1;
const FORMAT_PDF = 2;

async function exportBook(id, db, version, from, to, output, quiet, format) {
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
  if (!quiet) {
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
  }

  let len = 0;
  for (let item of volumes) {
    let volume = await db.findVolume(item.url);
    if (volume.length == 0) {
      throw new Error('Some volumes are not found locally. Please sync first');
    }
    len += volume[0].pages.length;
  }
  if (len == 0)
    throw new Error('Empty selection!');
  let bar = pace(len);
  let padToFour = number => number <= 9999 ? ("000"+number).slice(-4) : number;
  let volumeIndex = 0;

  let zipfile = new yazl.ZipFile();
  let doc = null;
  switch(format) {
    case FORMAT_CBZ:
      doc = new yazl.ZipFile();
      doc.outputStream.pipe(fs.createWriteStream(output)).on('close',
        () => console.log('Done'));
      break;
    case FORMAT_PDF:
      doc = new PDFDocument({ autoFirstPage: false });
      if ('title' in manga) doc.info.Title = manga.title;
      if ('author' in manga) doc.info.Author = manga.author;
      doc.pipe(fs.createWriteStream(output)).on('close',
        () => console.log('Done'));
      break;
  }
  for (let item of volumes) {
    let volume = await db.findVolume(item.url);
    for (let imageUrl of volume[0].pages) {
      let image = await db.findImage(imageUrl);
      if (image.length == 0) {
        throw new Error('Some images are not found locally. Please sync first');
      }
      bar.op();
      image = image[0];
      let entry = padToFour(volumeIndex) + '_' + image.volumeTitle + "/page_" + padToFour(image.pageNumber) + ".jpg";
      let buf = buffer.Buffer.from(image.data.value(), 'binary');
      switch(format) {
        case FORMAT_CBZ: doc.addBuffer(buf, entry); break;
        case FORMAT_PDF:
          let dims = sizeOf(buf);
          doc.addPage({ size: [dims.width, dims.height], margin: 0 });
          doc.image(buf);
          break;
      }
    }
    volumeIndex++;
  }
  doc.end();
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
        },
        quiet: {
          type: 'boolean',
            alias: 'q',
          default: false,
          describe: '跳过确认'
        },
    },
    handler: async (argv) => {
      let config = new Config();
      let conf = await config.get('database');
      let db = new DB();
      await db.connect(conf.server_name, conf.server_port, conf.db_name);
      let ext = path.extname(argv.output).toLowerCase();
      let format = FORMAT_UNKNOWN;
      if (ext === '.zip' || ext === '.cbz')
        format = FORMAT_CBZ;
      else if (ext === '.pdf')
        format = FORMAT_PDF;
      else
        throw new Error('Unknown export format');
      await exportBook(argv.manga_id, db, argv.version, argv.from, argv.to, argv.output, argv.quiet, format);
      await db.disconnect();
    }
};
