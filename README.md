# Dropbox Application

## Overview

This is a very rough implementation of a Dropbox server and client. The client and server
coordinate to sync two different directories similar to dropbox.

The Dropbox server accepts connections over a socket and allows clients to read the list of any
files within its root (or possibly outside), get stats about those files, and read or write to
those files. The client connects and continually checks the two folders for changes and then
copies over any changes from one folder that are needed in the other. The folder that uses the 
server to obtain information should be passed as the "-serverDirectory" or "--sd" argument with 
the "dnode://" prefix. The  folder that uses the local file operations to read/sync the directory 
should be passed as the "-clientDirectory" or "--cd" argument with the "file://" prefix.

## Installation

To install the application globally on your machine, run the following as an administrator from
within the directory with index.js:

```bash
sudo npm install -g
```

If you make changes to the application, you will need to rerun the command above to update the
dropbox and dropbox-server commands.


A global installation adds the "dropbox" and "dropbox-server" commands to your path.

To install the application locally, run the following command within the directory with index.js:

```bash
npm install
```

If you use the local installation method, you will run the application with the commands:

__Server:__
```bash
node lib/sync/sync-server.js
```

__Client:__
```bash
node index.js
```

## Usage

Assume that you have the following folder structure on your machine:

 - folderA
    - serverFolder
    - clientFolder

These are the directions to run the client and server to sync files between folder1 and folder2.
If you did a local install, replace all "dropbox" commands with "node index.js" and all referencs
to "dropbox-server" with "node lib/sync/sync-server.js"

First, you need to start the server (you will need two terminal windows open to do this). In
the first terminal window, change to the folder "folderA" directory, then run:

```bash
dropbox-server
```

Second, you need to start the client, which will monitor the folders for changes. In the second
terminal window, change to the "folderA" directory and then run:

```bash
dropbox --sd dnode://test-data/server --cd file://test-data/client
```

If you checked out the repo, you could do the following:

__Server:__
```bash
cd <the directory with index.js>
dropbox-server
```

__client:__
```bash
cd <the directory with index.js>
dropbox --sd ./server --cd ./client
```

If you checked out a fresh repo, you should immediately see something like:
```bash
Your Machine$ dropbox --sd dnode://test-data/server --cd file://test-data/client
Connected to Dropbox remote
Copied file://test-data/client/test.txt to dnode://test-data/server/test.txt
Copied file://test-data/client/test2.txt to dnode://test-data/server/test2.txt
```
Whatever files you put into folder1 or folder2 will now be copied to the other folder.
Changes will also be copied across directories.

## Code Overview

The core application driver for the client is in index.js. The core application driver
for the server is in lib/sync/sync-server.js. Most of the supporting code is in the
directories beneath the lib folder.

## Importing the Project Into WebStorm

Open WebStorm and then choose File->Open and then choose the directory containing index.js.