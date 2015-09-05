#! /usr/bin/env node

var mysql = require('mysql');
var prompt = require("prompt");
var _ = require('lodash');
var readline = require('readline');

var argv = require('yargs')
    .usage('Usage: dropbox [options]')
    .example('dropbox', '(after launching the dropbox-server) listen for beacon signals with the given receiver id and reporting websocket url')
    .describe('s', 'The sync server (defaults to 127.0.0.1)')
    .default('s',"127.0.0.1","127.0.0.1")
    .alias('s', 'server')
    .nargs('s', 1)
    .describe('p', 'The base port to connect to on the sync server')
    .alias('p', 'port')
    .nargs('p', 1)
    .default('p',5004,"5004")
    .epilog('Apache License V2 2015, Jules White')
    .argv;


var sync = require('./lib/sync/sync');
var dnodeClient = require("./lib/sync/sync-client");
var Pipeline = require("./lib/sync/pipeline").Pipeline;


var syncFile = function(fromPath,toPath){
    var srcHandler = sync.getHandler(fromPath);
    var trgHandler = sync.getHandler(toPath);

    srcHandler.readFile(fromPath,function(base64Data){
        trgHandler.writeFile(toPath,base64Data,function(){
            console.log("Copied "+fromPath+" to "+toPath);
        })
    });
};

var writePipeline = new Pipeline();
writePipeline.addAction({
    exec:function(data){
        _.each(data.syncToSrc, function(toSrc){
            var fromPath = data.trgPath + "/" + toSrc;
            var toPath = data.srcPath + "/" + toSrc;
            syncFile(fromPath,toPath);
        });
        return data;
    }
});
writePipeline.addAction({
    exec:function(data){
        _.each(data.syncToTrg, function(toTrg){
            var fromPath = data.srcPath + "/" + toTrg;
            var toPath = data.trgPath + "/" + toTrg;
            syncFile(fromPath,toPath);
        });
        return data;
    }
});

function checkForChanges(username){
    var path1 = "./server/"+username;
    var path2 = "./client";

    sync.compare(path1,path2,sync.filesMatchNameAndSize, function(rslt) {

        rslt.srcPath = path1;
        rslt.trgPath = path2;

        writePipeline.exec(rslt);
    });
}

var timer;
function scheduleChangeCheck(when,repeat,username){
    timer = setTimeout(function(){
        checkForChanges(username);

        if(repeat){scheduleChangeCheck(when,repeat,username)}
    },when);
}

function del(fileName) {
    if(!fileName){
        console.log('Please enter a file to delete');
        return;
    }
    var path1 = argv.directory1 + '/' + fileName;
    var path2 = argv.directory2 + '/' + fileName;
    var handler1 = sync.getHandler(path1);
    var handler2 = sync.getHandler(path2);
    try {
        handler1.deleteFile(path1, function(){});
        handler2.deleteFile(path2, function(){});
    } catch (err) {
        console.log(err.message);
        return;
    }
    console.log('Deleting ' + fileName);
}

// To add valid operations, map user input to the desired function
var userOps = {
    quit: null,
    test: function () { console.log('Test'); },
    func: function (in1, in2) { console.log(in1 + ' and ' + in2); },
    logout: null,
    delete: del
};

function getUserInput(){
    console.log('\nInput a command. Type "help" for available commands or "quit" to quit\n');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.prompt();
    rl.on('line', function(line) {
        var args = line.trim().split(' ');
        var operation = args.shift();

        if(operation == 'quit' || operation == 'logout') {
            rl.close();
            clearTimeout(timer);
            dnodeClient.end();
            if (operation == 'logout') {
                console.log("Logged out!\n");
                promptLogin();
            }
            return;
        } else if (operation == 'help') {
            for (var op in userOps) {
                if (userOps.hasOwnProperty(op)) {
                    console.log(' * ' + op);
                }
            }
        } else if (userOps.hasOwnProperty(operation)) {
            userOps[operation].apply(this, args);
        } else {
            console.log("Unknown option");
        }
        rl.prompt();
    });
}

function getPasswordFromDb(username) { return function(queryFinished) {
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'user'
        });
        connection.connect();
        connection.query('SELECT * FROM user WHERE username="' + username + '"', function (err, rows) {
            if (err) throw err;
            var password;
            if (rows.length != 0) {
                password = rows[0].password;
            }
            queryFinished(username,password);
        });
        connection.end();
    }
}

function promptLogin() {
    var schema = {
        properties: {
            username: {
                required: true
            },
            password: {
                hidden: true
            }
        }
    };

    prompt.colors = false;
    prompt.start();

    prompt.get(schema, function (err, result) {
        if (err) throw err;

        getPasswordFromDb(result.username)(
            function queryFinished(username,password) {
                if (result.password != password) {
                    console.log("Wrong login!\n");
                    promptLogin();
                } else {
                    console.log("Login successful!\n");
                    scheduleChangeCheck(1000,true,username);
                    getUserInput();
                }
            });
    });
}

dnodeClient.connect({host:argv.server, port:argv.port}, function(handler){
    sync.fsHandlers.dnode = handler;
    promptLogin();
});