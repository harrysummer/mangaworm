Mangaworm
=========
> Your ultimate comic management tool.

Introduction
------------
This is an ongoing work. It motivates by my own reading purpose for mangas on Chinese websites, since I want to read them offline on my eInk reader.

The basic logic of the software contains three steps:

1. Synchronize mange from website to local database
2. Store, manage the manga books locally.
3. Export the books to PDF/CBZ format.

Interface
---------
This program runs in commandline. It mainly will provide following commands

```bash
mangaworm search XXX        # search XXX on the web
mangaworm show ID           # show information of manga ID
mangaworm sync ID           # download manga ID to local
mangaworm export ID -o FILE # Export manga ID to FILE
```
Other cmmands will be gradually planned as the project goes on.

Install
-------
```bash
git clone https://github.com/harrysummer/mangaworm
cd mangaworm
npm install    # expect for long time waiting downloading dependencies
make
npm link
```

Dependencies
------------
* Latest NodeJS + NPM
* MongoDB

Disclaimer
----------
This program is for study use. Please obey your local law and regulations. If the user of this code breaks the law or regulation, the author would not take any responsibility.

License
-------
GPLv3
