import colors from 'ansi-256-colors'
import Promise from 'bluebird'
import { servers } from '../config'

const fieldNames = [
  'title', 'blocked', 'author', 'region',
  'status', 'theme', 'category', 'update',
  'detail', 'versions',
];
const fields = {
  title: '漫画名',
  blocked: (val) => val ? colors.fg.standard[1] + '无法下载' + colors.reset : false,
  cover: false,
  author: '作者',
  region: '地域',
  status: '作品状态',
  theme: '题材',
  category: '分类',
  update: '最近更新',
  detail: '内容简介',
  versions: (val) => {
    let ret = colors.fg.standard[6] + '版本数量：' + colors.reset + val.length;
    val.forEach((v) => ret += '\n  版本：' + v.version + '\t卷/话数：' + v.episodes.length);
    return ret;
  }
};

function show(id) {
	let ret = /^([^\/]+)\/(.*)$/.exec(id);
	if (ret != null) {
		let repo = ret[1];
		let name = ret[2];
		if (repo in servers) {
			let crawler = new servers[repo]();
			crawler.query(name)
			.then((data) => {
        fieldNames.forEach((field) => {
          if (field in data) {
            let f = fields[field];
            if (typeof f === 'function') {
              let ret = f(data[field]);
              if (typeof ret === 'string')
                console.log(ret);
              else if (typeof ret === 'boolean' && !ret) {
                // Do nothing
              } else {
                console.error('Error type');
              }
            } else if (typeof f === 'string') {
              console.log(colors.fg.standard[6] + f + '：' + colors.reset + data[field]);
            } else if (typeof f === 'boolean' && !f) {
              // Do nothing
            } else {
              console.error('Error type');
            }
          }
        });
			});
		} else {
			Promise.reject(new Error('Server "' + repo + '" is not available'));
		}
	} else {
		Promise.reject(new Error('Id "' + id + '" is invalid.'));
	}
}

export default {
	command: 'show',
	describe: 'Show online manga detail',
	handler: (argv) => argv._.slice(1).forEach((id) => show(id))
	
};
