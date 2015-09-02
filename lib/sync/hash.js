'use strict';

/* XXX: consider replacing var with const */
var crypto = require('crypto');
var stream = require('stream');
var util = require('util');

var error = require('./error');
var types = require('./types');

function HashError(message) {
  error.BaseError.call(this, message);
}

types.def_type(HashError, error.BaseError);
types.def_ro_prop(HashError.prototype, 'name', 'HashError');

function Hasher(flavor) {

  stream.Writable.call(this);

  if (flavor === undefined)
    flavor = 'sha256';

  /* checksum flavor is verified by crypto */
  var checksum = crypto.createHash(flavor);

  types.def_ro_prop(this, 'flavor', flavor);
  types.def_ro_prop(this, 'feed', function(chunk) {
    checksum.update(chunk);
    return this;
  });
  types.def_ro_prop(this, 'digest', function(format) {
    if (format === undefined)
      format = 'base64';
    var sum = checksum.digest(format);
    this.clear();
    return sum;
  });
  types.def_ro_prop(this, 'clear', function() {
    checksum = crypto.createHash(this.flavor);
    return this;
  });
  types.def_ro_prop(this, '_write', function(chunk, enc, k) {
    checksum.write(chunk, enc, k);
  });
}

types.def_type(Hasher, stream.Writable);

module.exports = { Hasher: Hasher };
