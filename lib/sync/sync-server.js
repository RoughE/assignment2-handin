#! /usr/bin/env node

var fs = require("fs");
var _ = require("lodash");
var dnode = require('dnode');
var base64util = require('./base64utils');

var argv = require('yargs')
    .usage('Usage: dropbox-server [options]')
    .example('dropbox-server -r ./', 'run the server with the current directory as the root')
    .alias('r', 'root')
    .nargs('r', 1)
    .default('r',"./","the current working directory")
    .describe('r', 'The root directory')
    .describe('p', 'The port to listen on')
    .alias('p', 'port')
    .nargs('p', 1)
    .default('p',5004,"5004")
    .epilog('Apache License V2 2015, Jules White')
    .argv;


console.log("Sync files in "+argv.root+" and accept connections on port "+argv.port);

var base = argv.root;

var server = dnode({
    list: function(path,cb){
        path = base + path;
        var rslt = fs.readdirSync(path);
        cb(rslt);
    },
    stat: function(path,cb){
        path = base + path;
        var rslt = fs.statSync(path);
        cb(rslt);
    },
    writeFile: function(path,base64data,cb){
        base64util.writeFromBase64Encoded(base64data, base + path);
        cb();
    },
    readFile: function(path,cb){
        cb(base64util.readBase64Encoded(base + path));
    }
});

server.listen(argv.port);


