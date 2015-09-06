'use strict';

var dnode = require('dnode');
var express = require('express');
var path = require('path');

var progname = 'http_server';

function create_router(rpc_entry) {

  function on_list(res, filepath) {
    rpc_entry['list'](filepath, function(result) {
      /* XXX: Errors are unhandled because error information is not
       * propagated through the rpc interface ...
       */
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'x-dropbox-method': 'list',
        'x-dropbox-path': filepath
      });
      res.write(JSON.stringify(result));
      res.end();
    });
  }

  function on_stat(res, filepath) {
    rpc_entry['stat'](filepath, function(result) {
      /* XXX: Errors are unhandled because error information is not
       * propagated through the rpc interface ...
       */
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'x-dropbox-method': 'stat',
        'x-dropbox-path': filepath
      });
      res.write(JSON.stringify(result));
      res.end();
    });
  }

  function on_read(res, filepath) {
    rpc_entry['readFile'](filepath, function(result) {
      /* XXX: Errors are unhandled because error information is not
       * propagated through the rpc interface ...
       */

      /* XXX: Is there a way to stream the results of base64-decoding into
       * the response without first copying into a buffer?
       */

      /* XXX: We really don't want to be sending directories over the wire
       * this way. This can be avoided with a call to stat and
       * manipulation of the mode mask, but there should be a better way.
       */
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'x-dropbox-method': 'read',
        'x-dropbox-path': filepath,
      });
      res.write(new Buffer(result, 'base64'));
      res.end();
    });
  }

  function write_handler(req, res) {
    /* XXX: Errors are unhandled because error information is not
     * propagated through the rpc interface ...
     */
    var filepath = path.normalize(req.params[0] || '/');
    if (req.headers['Content-Type'] !== 'application/octet-stream') {
      var msg = 'write accepts only binary data (application/octet-stream)';
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ 'error': msg }));
    } else {
      var data = new Buffer(req.body, 'base64');
      rpc_entry['writeFile'](filepath, data, function() {});
      res.writeHead(204, {
        'x-dropbox-method': 'write',
        'x-dropbox-path': filepath
      });
    }
    res.end();
  }

  function on_delete(res, filepath) {
    rpc_entry['deleteFile'](filepath, function(result) {
      /* XXX: Errors are unhandled because error information is not
       * propagated through the rpc interface ...
       */
      res.writeHead(204, {
        'x-dropbox-method': 'delete',
        'x-dropbox-path': filepath,
      });
      res.end();
    });
  }

  function create_handler(on_event) {
    return function(req, res) {
      on_event(res, path.normalize(req.params[0] || '/'));
    };
  }

  var router = express.Router();
  router.get('/list*', create_handler(on_list));
  router.get('/stat*', create_handler(on_stat));
  router.get('/read*', create_handler(on_read));
  router.put('/write*', write_handler);
  router.delete('/delete*', create_handler(on_delete));
  router.use(function(req, res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ 'error': 'unknown api call: ' + req.path }));
  });

  return router;
}

function spawn_server(dnode_host, dnode_port, port) {

  var dsock = dnode();
  var app = express();

  dsock.on('error', function() {
    console.log('http_server: failed to connect to remote server');
    process.exit(1);
  });

  dsock.on('fail', function() {
    console.log('http_server: something bad happened');
    process.exit(1);
  });

  dsock.connect({ host: dnode_host, port: dnode_port }, function(rpc_entry) {
    app.use('/api', create_router(rpc_entry));

    var server = app.listen(port);
    var addr = server.address().address;
    console.log('http_server: listening on ' + addr + ':' + port);

    dsock.on('end', function() {
      console.log('http_server: connection to remote server terminated');
      /* attempt to restart on remote conn death */
      spawn_server(dnode_host, dnode_port, port);
    });
  });
}

spawn_server('127.0.0.1', '5004', '3000');
