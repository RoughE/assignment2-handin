var dnode = require('dnode');
var _ = require("lodash");
var fs = require('fs');
var uris = require("./dropboxuris");

var connectStatus = false;

var d = dnode();

d.on('end', function() {
    console.log("dnodeClient disconnected from server.");
    connectStatus = false;
});

function connect(options,onConnect,username,password) {
    options = options || {};
    var port = options.port || 5004;
    var host = options.host || "127.0.0.1";

    var conn = d.connect(host,port);
    var server = null;

    conn.on('remote', function (remote) {
        server = remote;

        server.login(username,password,function() {
            connectStatus = true;
        }, function() {
            connectStatus = false;
        });

        onConnect({
            list:function(path,cb){
                path = uris.getPath(path);
                server.list(path,cb);
            },
            stat:function(path,cb){
                path = uris.getPath(path);
                server.stat(path,cb);
            },
            writeFile: function(path,base64data,cb){
                path = uris.getPath(path);
                server.writeFile(path,base64data,cb);
            },
            readFile: function(path,cb){
                path = uris.getPath(path);
                server.readFile(path,cb);
            },
            deleteFile: function(path,cb){
                path = uris.getPath(path);
                server.deleteFile(path,cb);
            }
        });
    });
}

function disconnect() {
    d.end();
}

module.exports = {
    connectStatus: connectStatus,
    connect: connect,
    disconnect: disconnect
}
