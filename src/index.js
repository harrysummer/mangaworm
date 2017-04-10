import yargs from 'yargs';
import search from './command/search';
import show from './command/show';
import sync from './command/sync';
import list from './command/list';
import config from './command/config';
import export_ from './command/export';

yargs.usage('mangaworm -- your personal manga management software')
  .command(search)
  .command(show)
  .command(sync)
  .command(list)
  .command(config)
  .command(export_)
  .help()
  .argv;
