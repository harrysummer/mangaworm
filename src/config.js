import path from 'path';
import AppDirectory from 'appdirectory';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import dmzj from './server/dmzj';
import { fs } from './async-api';

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
  }

  async create() {
    console.log('No configuaration found. Create one.');
    let answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'server_name',
        message: 'Mongodb server name',
        default: 'localhost',
      },
      {
        type: 'input',
        name: 'server_port',
        message: 'Mongodb server port',
        default: 27017,
      },
      {
        type: 'input',
        name: 'db_name',
        message: 'Name of the database',
        default: 'mangaworm'
      },
    ]);

    let configContent = yaml.safeDump({ database: answer });
    console.log('Wrting configuration to ' + this.config_file);
    await fs.mkdirpAsync(path.dirname(this.config_file));
    await fs.writeFileAsync(this.config_file, configContent);
  }

  async parse() {
    try {
      await fs.accessAsync(this.config_file, fs.constants.F_OK);
    } catch(err) {
      try {
        await this.create();
      } catch(err) {
        console.error('Cannnot create configuration file.');
        process.exit(-1);
      }
    }

    let content;
    try {
      content = await fs.readFileAsync(this.config_file);
    } catch(err) {
      console.log(err.message);
      process.exit(-1);
    }
    return yaml.safeLoad(content);
  }
};
