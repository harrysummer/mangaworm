import yargs from 'yargs';
import search from './command/search';
import show from './command/show';
import sync from './command/sync';
import list from './command/list';

yargs.usage('mangaworm -- your personal manga management software')
  .command(search)
  .command(show)
  .command(sync)
  .command(list)
  .command('config', 'Get/set the configurations')
  .command('export', 'Export manga book to PDF or CBZ format')
  .help()
  .argv;
