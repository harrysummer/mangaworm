Mangaworm
=========
> Your ultimate manga management software.

Introduction
------------
This is an ongoing work. It motivates by my own reading purpose for mangas on Chinese websites. Since I want to read them offline on my eInk reader, The basic logic of the software contains three steps:

1. Synchronize mange from website to local PC.
2. Store, manage the manga books locally.
3. Export the books to PDF/CBZ format.

Interface
---------
This program runs in commandline. It mainly will provide following commands

```bash
mangaworm search XXX        # search XXX on the web
mangaworm show ID           # show information of manga ID
mangaworm sync ID           # download manga ID to local
mangaworm export ID FILE    # Export manga ID to FILE
```
Other cmmands will be gradually planned as the project goes on.

Install
-------
```bash
git clone https://github.com/harrysummer/mangaworm
cd mangaworm
npm install
make
```

Dependencies
------------
* Latest NodeJS + NPM
* MongoDB
* (Maybe PDF/CBZ creating utilities)

Disclamer
---------
This program is for study use. Please obey your local law and regulations. If the user of this code breaks the law or regulation, the author would not take any responsibility.

License
-------
GPLv3
