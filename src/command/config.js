import util from 'util';
import Config from '../config';

export default {
  command: 'config',
  describe: 'Get/set the configurations',
  builder: (yargs) => yargs
    .command({
      command: 'get [key]',
      desc: 'Get configuration',
      handler: async (argv) => {
        let config = new Config();
        let value = await config.get(argv.key);
        if (argv.key === undefined)
          console.log(util.inspect(value));
        else
          console.log(`${argv.key} = ${util.inspect(value)}`);
      }
    })
    .command({
      command: 'set <key> [value]',
      desc: 'Set configuration',
      handler: async (argv) => {
        let config = new Config();
        await config.set(argv.key, argv.value);
      }
    })
    .demandCommand(1, 'Please specify get or set.')
    .help()
    .argv,
};
