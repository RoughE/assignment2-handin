#! /usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var uris = require("./lib/sync/dropboxuris");

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
var Twit = require('twit');

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

function scheduleChangeCheck(when,repeat){
    setTimeout(function(){
        checkForChanges();

        if(repeat){scheduleChangeCheck(when,repeat)}
    },when);
}

dnodeClient.connect({host:argv.server, port:argv.port}, function(handler){
    sync.fsHandlers.dnode = handler;
    scheduleChangeCheck(1000,true);
});


function initiateTwitter(){
    var Twitter = new Twit({
        consumer_key: 'lF0toTHTD5BQxbvrfoy87scqz'
        , consumer_secret: 'ERq30rIPQlouR0qpNKrYDudsdpIzplmTxeAhz9C5RivmovZ8bK'
        , access_token: '3529755022-pSnr3zgRME4H1jK7hR6s109LCg1Ace8205EnmCO'
        , access_token_secret: 'xjmXeXsigPoDBYFY6ZGMDPKds0wQibf8iOZ599k1cs0R1'
    })

    //Upload media to Twitter
    Twitter.upload = function uploadToTwitter(fileToUpload){
        //The image passed should be the raw binary of the image or binary base64 encoded
        var mediaContent= fs.readFileSync(fileToUpload, { encoding: 'base64' });
        TwitterApp.post('media/upload', { media_data: mediaContent }, function (err, data, response) {

            var mediaIdStr = data.media_id_string;
            console.log(mediaIdStr);
            console.log(data);
            var params = { media_ids: [mediaIdStr]};

            TwitterApp.post('statuses/update', params, function (err, data, response) {
                console.log(data);
            })
        })
    };

    return Twitter;
}


var readline = require('readline');

//Will include an option for Facebook in the future
function initiate(){
    var socialMedia;
    socialMedia = initiateTwitter();

    return socialMedia
}

function serverHandler(path) {
    getFiles = function(path){
        console.log(files);
        return fs.readdirSync(path);
    }

    return {
        files: getFiles(path)
    }
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter 'exit' to exit", function(answer) {
    if (answer != "exit") {
        if (answer === "upload") {
            //Print out the files in the server folder
            var sHandler = serverHandler(uris.getPath(argv.directory1));
            console.log(sHandler);
            var files = sHandler.files;

            for (var key in files){
                console.log(files[key]);
            }
            /*
             var socialMedia = initiate();
             socialMedia.upload()*/
            }
        }
    rl.close();
});

