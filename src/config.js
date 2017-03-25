import path from 'path';
import AppDirectory from 'appdirectory';
import fs from 'fs';
import Promise from 'bluebird';
import dmzj from './server/dmzj';

export const app_name = "mangaworm";

export let servers = {
  dmzj
};

export default class Config {
  static get DEFAULT_CONFIG_FILE_NAME() { return "config.json"; }

  constructor(file_name) {
    if (file_name === undefined) {
      let dirs = new AppDirectory(app_name);
      let config_dir = dirs.userConfig();
      this.config_file = path.join(config_dir, Config.DEFAULT_CONFIG_FILE_NAME);
    } else {
      this.config_file = path.normalize(file_name);
    }

    this.onParseFinished = Promise.promisify(fs.access)
    (this.config_file, fs.constants.F_OK)
      .catch(() => {
        if (!this.create()) {
          console.log('No config file. Exit.');
          process.exit(-1);
        }
      })
      .finally(() => this.parse(this.config_file));
  }

  create() {
    console.log('config.create not implemented');
    return false;
  }

  parse() {
    console.log('config.parse not implemented');
  }
};
