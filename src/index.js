import yargs from 'yargs';
import search from './command/search';
import show from './command/show';
import sync from './command/sync';
import list from './command/list';
import config from './command/config';
import export_ from './command/export';
import process from 'process';
import ON_DEATH from 'death';

ON_DEATH((signal,err) => {
  console.log('Dying...');
  if (signal)
    console.log(signal);
  if (err)
    console.log(err.stack);
});

processs.on('unhandledRejection', (err) =>
  throw err);

yargs.usage('mangaworm -- your personal manga management software')
  .command(search)
  .command(show)
  .command(sync)
  .command(list)
  .command(config)
  .command(export_)
  .help()
  .argv;
