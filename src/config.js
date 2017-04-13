import path from 'path';
import AppDirectory from 'appdirectory';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import util from 'util';
import dmzj from './server/dmzj';
import dm5 from './server/dm5';
import tencent from './server/tencent';
import { fs } from './async-api';

export const app_name = "mangaworm";

export let servers = {
  dmzj,
  dm5,
  tencent,
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

  async get(name) {
    try {
      await fs.accessAsync(this.config_file, fs.constants.F_OK);
    } catch(err) {
      await this.create();
    }

    let content = await fs.readFileAsync(this.config_file);
    let conf = yaml.safeLoad(content);
    if (name === undefined) {
      return conf;
    } else {
      name = name.split('.');
      for (let i = 0; i < name.length; i++) {
        conf = conf[name[i]];
        if (conf === undefined)
          return conf;
      }
      return conf;
    }
  }

  async set(name, value) {
    try {
      await fs.accessAsync(this.config_file, fs.constants.F_OK);
    } catch(err) {
      await this.create();
    }

    let content = await fs.readFileAsync(this.config_file);
    let conf = yaml.safeLoad(content);
    let isdelete = value === undefined;
    name = name.split('.');

    let prev = {dummy: conf};
    let attrname;
    let cur = prev.dummy;
    for (let i = 0; i < name.length; i++) {
      if (typeof cur === 'object') {
        if (!(name[i] in cur)) {
          if (!isdelete) {
            cur[name[i]] = {};
          } else {
            return;
          }
        }
        prev = cur;
        cur = cur[name[i]];
        attrname = name[i];
      } else {
        throw new Error('Cannot walk to ' + util.inspect(name));
      }
    }
    if (!isdelete) {
      prev[attrname] = value;
    } else {
      delete prev[attrname];
    }

    let configContent = yaml.safeDump(conf);
    await fs.writeFileAsync(this.config_file, configContent);
  }
};
