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
var validSessions = [];

var server = dnode({
    list: function(path,session,cb){

        console.log(session);
        if(!_.includes(validSessions,session)){
            throw "Not authenticated! 1";
        }

        path = base + path;
        var rslt = fs.readdirSync(path);
        cb(rslt);
    },
    stat: function(path,session,cb){

        if(!_.includes(validSessions,session)){
            throw "Not authenticated! 2";
        }

        path = base + path;
        var rslt = fs.statSync(path);
        cb(rslt);
    },
    writeFile: function(path,session,base64data,cb){

        if(!_.includes(validSessions,session)){
            throw "Not authenticated! 3";
        }

        base64util.writeFromBase64Encoded(base64data, base + path);
        cb();
    },
    readFile: function(path,session,cb){

        if(!_.includes(validSessions,session)){
            throw "Not authenticated! 4";
        }

        cb(base64util.readBase64Encoded(base + path));
    },
    deleteFile: function(path,session,cb){

        if(!_.includes(validSessions,session)){
            throw "Not authenticated! 5";
        }

        try{
            fs.unlinkSync(base + path);
        } catch (err) {
            console.log(err.message);
        }
        cb();
    },
    login: function(username, password, cb1, cb2) {
        if(username === "baihua" && password === "password") {
            // success
            var session = "asdf";
            validSessions.push(session);

            console.log("You've logged in as Baihua.");
            cb1(session);
        } else {
            // failure
            console.log("Invalid user credentials.");
            cb2();
        }
    }
}/*, {weak:false}*/);

server.listen(argv.port);
