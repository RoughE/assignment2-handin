'use strict';

/* Define an attribute attached to the provided object, accessible through
 * the provided getter and setter functions.
 */
function def_attr(obj, prop_name, prop_get, prop_set) {
  Object.defineProperty(obj, prop_name, {
    enumerable: true,
    get: prop_get,
    set: prop_set
  });
}

/* Define a read-only attribute attached to the enclosing scope and
 * accessed through the provided getter.
 */
function def_ro_attr(obj, prop_name, prop_get) {
  def_attr(prop_name, prop_get, undefined, obj);
}

/* Define a read-only property attached to the provided object and
 * accessible directly by name.
 */
function def_ro_prop(obj, prop_name, prop_value) {
  Object.defineProperty(obj, prop_name, {
    enumerable: true,
    value: prop_value
  });
}

function def_method(type, name, method) {
  Object.defineProperty(type.prototype, prop_name, { value: method });
}

/* Define boilerplate prototype properties. */
function def_type(cons, proto) {
  if (typeof cons !== 'function')
    throw new TypeError('invalid constructor')
  cons.prototype = Object.create(proto === undefined ? null : proto.prototype);
  def_ro_prop(cons, 'constructor', cons);
}

module.exports = {
  def_attr: def_attr,
  def_method: def_method,
  def_ro_attr: def_ro_attr,
  def_ro_prop: def_ro_prop,
  def_type: def_type
};
