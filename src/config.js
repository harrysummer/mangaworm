import path from 'path';
import AppDirectory from 'appdirectory';
import fs from 'fs';
import Promise from 'bluebird';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import mkdirp from 'mkdirp';
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
      .catch(() =>
        this.create()
        .catch(() => {
          console.log('No config file. Exit.');
          process.exit(-1);
        })
      )
      .finally(() => this.parse(this.config_file));
  }

  create() {
    console.log('No configuaration found. Create one.');
    return inquirer.prompt([
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
        name: 'database',
        message: 'Name of the database',
        default: 'mangaworm'
      },
    ])
    .then((answer) => {
      let configContent = yaml.safeDump(answer);
      console.log(this.config_file);
      return Promise.promisify(mkdirp)(path.dirname(this.config_file))
      .then(() =>
        Promise.promisify(fs.writeFile)(this.config_file, configContent));
    });
  }

  parse() {
    return Promise.promisify(fs.readFile)(this.config_file)
    .then((content) => {
      this.config = yaml.safeLoad(content);
    });
  }

  get(name) {
    return this.config[name];
  }
};
