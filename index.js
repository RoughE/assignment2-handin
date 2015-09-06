#! /usr/bin/env node

var fs = require('fs');
var prompt = require("prompt");
var _ = require('lodash');
var readline = require('readline');

var argv = require('yargs')
    .usage('Usage: dropbox [options]')
    .example('dropbox --serverDirectory test-data/server --clientDirectory test-data/client', '(after launching the dropbox-server) listen for beacon signals with the given receiver id and reporting websocket url')
    .demand(['sd','cd'])
    .alias('sd', 'serverDirectory')
    .nargs('sd', 1)
    .describe('sd', 'The server directory to sync (e.g., dnode://test-data/server)')
    .alias('cd', 'clientDirectory')
    .nargs('cd', 1)
    .describe('cd', 'The client directory to sync (e.g., file://test-data/client)')
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

var db = require('./lib/sync/db');
var sync = require('./lib/sync/sync');
var dnodeClient = require("./lib/sync/sync-client");
var Pipeline = require("./lib/sync/pipeline").Pipeline;
var directories = {serverDirectory: "", clientDirectory: ""};

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

function checkForChanges(){

    sync.compare(directories.serverDirectory,directories.clientDirectory,sync.filesMatchNameAndSize, function(rslt) {

        rslt.srcPath = directories.serverDirectory;
        rslt.trgPath = directories.clientDirectory;

        writePipeline.exec(rslt);
    });
}

var timer;
function scheduleChangeCheck(when,repeat){
    timer = setTimeout(function(){
        checkForChanges();

        if(repeat){scheduleChangeCheck(when,repeat)}
    },when);
}

function del(fileName) {
    if(!fileName){
        console.log('Please enter a file to delete');
        return;
    }
    var path1 = directories.serverDirectory + '/' + fileName;
    var path2 = directories.clientDirectory + '/' + fileName;
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
    delete: del,
    logout: null
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
            if (operation == 'logout') {
                console.log("Logged out!\n");
                promptLoginOrCreate();
            } else {
                dnodeClient.end();
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

function promptLoginOrCreate() {
    prompt.colors = false;
    prompt.start();

    prompt.get({
        properties: {
            answer: {
                description: "Would you like to create a new login? (Y/n)"
            }
        }
    }, function (err, result) {
        if (err) throw err;

        if (result.answer == 'Y' || result.answer == 'y') {
            showLogin(function createLogin(result) {
                db.usernameExistsInDb(result.username, function queryFinished(usernameExists) {
                    if (!usernameExists) {
                        db.addLoginToDb(result, function queryFinished(username) {
                            // create user server directory
                            fs.mkdirSync(argv.serverDirectory+"/"+username);
                            directories.serverDirectory = argv.serverDirectory+"/"+username;
                            directories.clientDirectory = argv.clientDirectory;
                            scheduleChangeCheck(1000,true);
                            getUserInput();
                        });
                    } else {
                        console.log('Username already exists!\n');
                        promptLoginOrCreate();
                    }
                });
            });
        } else if (result.answer == 'N' || result.answer == 'n') {
            showLogin(function login(result) {
                db.getPasswordFromDb(result.username, function queryFinished(login) {
                    if (result.password != login.password) {
                        console.log('Wrong login!\n');
                        promptLoginOrCreate();
                    } else {
                        console.log('Login successful!\n');
                        directories.serverDirectory = argv.serverDirectory+"/"+login.username;
                        directories.clientDirectory = argv.clientDirectory;
                        scheduleChangeCheck(1000,true);
                        getUserInput();
                    }
                });
            });
        } else {
            promptLoginOrCreate();
        }
    });
}

function showLogin(callback) {
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

        callback(result);
    });
}

dnodeClient.connect({host:argv.server, port:argv.port}, function(handler){
    sync.fsHandlers.dnode = handler;
    promptLoginOrCreate();
});