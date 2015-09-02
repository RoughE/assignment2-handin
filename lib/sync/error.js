'use strict';

/* XXX: consider replacing var with const */
var types = require('./types');
var def_ro_prop = types.def_ro_prop;
var def_type = types.def_type;

/* Constructor for user-definable error types. Mainly exists to extract
 * automate generation of a stack trace.
 */
function BaseError(message) {
  types.def_ro_prop(this, 'message', message);
  /* Generate and hijack a stack trace from a primitive Error object. */
  types.def_ro_prop(this, 'stack', (new Error()).stack);
}

types.def_type(BaseError, Error);
types.def_ro_prop(BaseError.prototype, 'name', 'BaseError');

module.exports = {
  BaseError: BaseError
}
