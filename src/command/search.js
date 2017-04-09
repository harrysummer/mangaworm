import colors from 'ansi-256-colors'
import { servers } from '../config'
import { awaitAll } from '../async-api';

async function search(query) {
  awaitAll(servers, async (server,repo) => {
    let crawler = new server();
    let result = await crawler.search(query);
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
  handler: (argv) => search(argv._.slice(1).join(' ')),
};
