var dnode = require('dnode');
var _ = require("lodash");
var uris = require("./dropboxuris");

var d = dnode({},{weak:false});

function connect(options,onConnect) {
    options = options || {};
    var port = options.port || 5004;
    var host = options.host || "127.0.0.1";

    var conn = d.connect(host,port);
    var server = null;

    conn.on('remote', function (remote) {
        console.log("Connected to Dropbox remote\n");
        server = remote;

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
            },
            login: function(path,cb) {
                path = uris.getPath(path);
                server.setUsername(path,cb);
            }
        });
    });
}

module.exports = {
    connect: connect,
    end: function() { d.end(); }
}
