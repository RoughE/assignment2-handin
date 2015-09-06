#! /usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var readline = require('readline');

var argv = require('yargs')
    .usage('Usage: dropbox [options]')
    .example('dropbox --directory1 dnode://test-data/folder1 --directory2 file://test-data/folder2', '(after launching the dropbox-server) listen for beacon signals with the given receiver id and reporting websocket url')
    .demand(['d1','d2'])
    .alias('d1', 'directory1')
    .nargs('d1', 1)
    .describe('d1', 'The first directory to sync (e.g., dnode://test-data/folder1)')
    .alias('d2', 'directory2')
    .nargs('d2', 1)
    .describe('d2', 'The second directory to sync (e.g., file://test-data/folder2)')
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
}

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
    var path1 = argv.directory1;
    var path2 = argv.directory2;

    sync.compare(path1,path2,sync.filesMatchNameAndSize, function(rslt) {

        rslt.srcPath = path1;
        rslt.trgPath = path2;

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


function rename(currentFileName, newFileName) {
    if(!currentFileName){
        console.log('Please enter a file to rename');
        return;
    }
    var path1 = argv.directory1 + '/' + currentFileName;
    var path2 = argv.directory2 + '/' + currentFileName;

    var path1new = argv.directory1 + '/' + newFileName;
    var path2new = argv.directory2 + '/' + newFileName;

    var handler1 = sync.getHandler(path1);
    var handler2 = sync.getHandler(path2);

    var handler1new = sync.getHandler(path1new);
    var handler2new = sync.getHandler(path2new);

    try {
        handler1.renameFile(path1,path1new , function(){});
        handler2.renameFile(path2, path2new, function(){});
    } catch (err) {
        console.log(err.message);
        return;
    }
    console.log('Renaming  ' + currentFileName + " to " + newFileName);
}

// To add valid operations, map user input to the desired function
var userOps = {
    quit: null,
    rename: function (in1, in2) { rename(in1,in2); },
    test: function () { console.log('Test'); },
    func: function (in1, in2) { console.log(in1 + ' and ' + in2); },
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

        if(operation == 'quit') {
            rl.close();
            clearTimeout(timer);
            dnodeClient.end();
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

dnodeClient.connect({host:argv.server, port:argv.port}, function(handler){
    sync.fsHandlers.dnode = handler;
    scheduleChangeCheck(1000,true);
    getUserInput();
});
