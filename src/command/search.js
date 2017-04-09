import colors from 'ansi-256-colors'
import { servers } from '../config'
import { all } from '../async-api';

async function search(query, raw) {
  await all(servers, async (server,repo) => {
    let crawler = new server();
    let result = await crawler.search(query);
    if (raw) {
      console.log(result);
      return;
    }
    result.forEach((item) => {
      console.log(colors.fg.bright[2] + item.id + colors.reset);
      console.log(colors.fg.bright[4] + item.title + '\t'
        + colors.fg.standard[4] + item.author
        + (item.complete ? ' ' +
          colors.fg.bright[1] + "已完结" : '')
        + colors.reset);
    });
  });
};

export default {
  command: 'search',
  describe: 'Search for online manga',
  builder: {
    raw: {
      type: 'boolean',
      alias: 'r',
    },
  },
  handler: (argv) => search(argv._.slice(1).join(' '), argv.raw),
};
