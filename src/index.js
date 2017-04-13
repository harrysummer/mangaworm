#!/usr/bin/env node
import yargs from 'yargs';
import search from './command/search';
import show from './command/show';
import sync from './command/sync';
import list from './command/list';
import remove from './command/remove';
import config from './command/config';
import export_ from './command/export';
import process from 'process';

process.on('unhandledRejection', (err) => {
  console.log(err.stack);
});

yargs.usage('mangaworm -- your personal manga management software')
  .command(search)
  .command(show)
  .command(sync)
  .command(list)
  .command(remove)
  .command(config)
  .command(export_)
  .demandCommand(1)
  .help()
  .argv;
