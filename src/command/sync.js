import Config from '../config';

function sync(config, id) {
  console.log('sync(config, id) not implemented');
}

export default {
  command: 'sync',
  describe: 'Sync manga from online to local',
  handler: (argv) => {
    let config = new Config();
    config.onParseFinished
      .then(() => argv._.slice(1).forEach((id) => sync(config, id)));
  }
}
