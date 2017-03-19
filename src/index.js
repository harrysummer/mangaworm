import yargs from 'yargs';
import search from './command/search';
import show from './command/show';

yargs.usage('mangaworm -- your personal manga management software')
  .command(search)
  .command(show)
  .command('sync', 'Sync local repository with online')
  .command('list', 'List local manga books')
  .command('config', 'Get/set the configurations')
  .command('export', 'Export manga book to PDF or CBZ format')
  .help()
  .argv;
