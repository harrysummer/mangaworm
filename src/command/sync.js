import Config from '../config';

function sync(config, id) {
  console.log('sync(config, id) not implemented');
}

export default {
  command: 'sync',
  describe: 'Sync manga from online to local',
  handler: async (argv) => {
    let config = new Config();
    let conf = await config.parse();
    argv._.slice(1).forEach((id) => sync(conf, id));
  }
}
