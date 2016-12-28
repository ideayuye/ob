(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.Ob = factory());
}(this, (function () { 'use strict';

/**
 * Remove an item from an array
 */
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
var toString = Object.prototype.toString;
var OBJECT_STRING = '[object Object]';
function isPlainObject (obj) {
  return toString.call(obj) === OBJECT_STRING
}

/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

var hasConsole = typeof console !== 'undefined';
function warn(msg, vm) {
    if (hasConsole) {
        console.error(("[Ob warn]: " + msg + " "));
    }
}


/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  } else {
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }
}

var hasProto = '__proto__' in {};



/* istanbul ignore next */
function isNative (Ctor) {
  return /native code/.test(Ctor.toString())
}
var _Set;
/* istanbul ignore if */
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] !== undefined
    };
    Set.prototype.add = function add (key) {
      this.set[key] = 1;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/* @flow */

var uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stablize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

Dep.target = null;
var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var arguments$1 = arguments;

    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length;
    var args = new Array(i);
    while (i--) {
      args[i] = arguments$1[i];
    }
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
        inserted = args;
        break
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/* @flow */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
var observerState = {
  shouldConvert: true,
  isSettingProps: false
};

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    var augment = hasProto
      ? protoAugment
      : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i], obj[keys[i]]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * istanbul ignore next
 */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value){
  if (!isObject(value)) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    observerState.shouldConvert &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive (
  obj,
  key,
  val,
  customSetter
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;

  var childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        if (Array.isArray(value)) {
          dependArray(value);
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (obj, key, val) {
  if (Array.isArray(obj)) {
    obj.length = Math.max(obj.length, key);
    obj.splice(key, 1, val);
    return val
  }
  if (hasOwn(obj, key)) {
    obj[key] = val;
    return
  }
  var ob = obj.__ob__;
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return
  }
  if (!ob) {
    obj[key] = val;
    return
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (obj, key) {
  var ob = obj.__ob__;
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(obj, key)) {
    return
  }
  delete obj[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/* @flow */

var uid$1 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options
) {
  if ( options === void 0 ) options = {};

  this.vm = vm;
  vm._watchers.push(this);
  // options
  this.deep = !!options.deep;
  this.user = !!options.user;
  this.lazy = false;//备用
  this.sync = true; //备用
  this.expression = expOrFn.toString();
  this.cb = cb;
  this.id = ++uid$1; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      process.env.NODE_ENV !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value = this.getter.call(this.vm, this.vm);
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value);
  }
  popTarget();
  this.cleanupDeps();
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } 
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 * back
 */
/*evaluate () {
  this.value = this.get()
  this.dirty = false
}*/

/**
 * Depend on all deps collected by this watcher.
 * back
 */
/*depend () {
  let i = this.deps.length
  while (i--) {
    this.deps[i].depend()
  }
}*/

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed or is performing a v-for
    // re-render (the watcher list is then filtered by v-for).
    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

var seenObjects = new _Set();
function traverse (val) {
  seenObjects.clear();
  _traverse(val, seenObjects);
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

function initData(vm, data) {
    if (!isPlainObject(data)) {
      data = {};
      process.env.NODE_ENV !== 'production' && warn(
        'data should be an plain object.',
        vm
      );
      return ;
    }

    // proxy data on instance
    var keys = Object.keys(data);
    var i = keys.length;
    while (i--) {
        proxy(vm, keys[i]);
    }
    // observe data
    observe(data);
    data.__ob__ && data.__ob__.vmCount++;
    vm._data = data;
}

function proxy(vm, key) {
    if (!isReserved(key)) {
        Object.defineProperty(vm, key, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
                return vm._data[key]
            },
            set: function proxySetter(val) {
                vm._data[key] = val;
            }
        });
    }
}

function Ob(obj) {
    this._watchers = [];
    initData(this, obj);
    this._isInited = !!this._data;
    this.$set = set;
    this.$del = del;

    this.watch = function (getter, cb, options) {
        var wat = new Watcher(this, getter, cb, options);
        return wat.teardown.bind(wat);
    };
}

Ob.version = '1.0.0';

return Ob;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL2RlcC5qcyIsIi4uL3NyYy9hcnJheS5qcyIsIi4uL3NyYy9vYnNlcnZlLmpzIiwiLi4vc3JjL3dhdGNoZXIuanMiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlIGFuIGl0ZW0gZnJvbSBhbiBhcnJheVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZSAoYXJyLCBpdGVtKSB7XHJcbiAgaWYgKGFyci5sZW5ndGgpIHtcclxuICAgIGNvbnN0IGluZGV4ID0gYXJyLmluZGV4T2YoaXRlbSlcclxuICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgIHJldHVybiBhcnIuc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFF1aWNrIG9iamVjdCBjaGVjayAtIHRoaXMgaXMgcHJpbWFyaWx5IHVzZWQgdG8gdGVsbFxyXG4gKiBPYmplY3RzIGZyb20gcHJpbWl0aXZlIHZhbHVlcyB3aGVuIHdlIGtub3cgdGhlIHZhbHVlXHJcbiAqIGlzIGEgSlNPTi1jb21wbGlhbnQgdHlwZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc09iamVjdCAob2JqKSB7XHJcbiAgcmV0dXJuIG9iaiAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0J1xyXG59XHJcblxyXG4vKipcclxuICogU3RyaWN0IG9iamVjdCB0eXBlIGNoZWNrLiBPbmx5IHJldHVybnMgdHJ1ZVxyXG4gKiBmb3IgcGxhaW4gSmF2YVNjcmlwdCBvYmplY3RzLlxyXG4gKi9cclxuY29uc3QgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXHJcbmNvbnN0IE9CSkVDVF9TVFJJTkcgPSAnW29iamVjdCBPYmplY3RdJ1xyXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFpbk9iamVjdCAob2JqKSB7XHJcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gT0JKRUNUX1NUUklOR1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2sgd2hldGhlciB0aGUgb2JqZWN0IGhhcyB0aGUgcHJvcGVydHkuXHJcbiAqL1xyXG5jb25zdCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcclxuZXhwb3J0IGZ1bmN0aW9uIGhhc093biAob2JqLCBrZXkpIHtcclxuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcclxufVxyXG5cclxuY29uc3QgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJ1xyXG5leHBvcnQgZnVuY3Rpb24gd2Fybihtc2csIHZtKSB7XHJcbiAgICBpZiAoaGFzQ29uc29sZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtPYiB3YXJuXTogJHttc2d9IGApXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lIGEgcHJvcGVydHkuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVmIChvYmosIGtleSwgdmFsLCBlbnVtZXJhYmxlKSB7XHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XHJcbiAgICB2YWx1ZTogdmFsLFxyXG4gICAgZW51bWVyYWJsZTogISFlbnVtZXJhYmxlLFxyXG4gICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICBjb25maWd1cmFibGU6IHRydWVcclxuICB9KVxyXG59XHJcblxyXG4vKipcclxuICogUGFyc2Ugc2ltcGxlIHBhdGguXHJcbiAqL1xyXG5jb25zdCBiYWlsUkUgPSAvW15cXHcuJF0vXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBhdGggKHBhdGgpIHtcclxuICBpZiAoYmFpbFJFLnRlc3QocGF0aCkpIHtcclxuICAgIHJldHVyblxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IHBhdGguc3BsaXQoJy4nKVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICghb2JqKSByZXR1cm5cclxuICAgICAgICBvYmogPSBvYmpbc2VnbWVudHNbaV1dXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9ialxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGhhc1Byb3RvID0gJ19fcHJvdG9fXycgaW4ge31cclxuXHJcblxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuZnVuY3Rpb24gaXNOYXRpdmUgKEN0b3IpIHtcclxuICByZXR1cm4gL25hdGl2ZSBjb2RlLy50ZXN0KEN0b3IudG9TdHJpbmcoKSlcclxufVxyXG5sZXQgX1NldFxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuaWYgKHR5cGVvZiBTZXQgIT09ICd1bmRlZmluZWQnICYmIGlzTmF0aXZlKFNldCkpIHtcclxuICAvLyB1c2UgbmF0aXZlIFNldCB3aGVuIGF2YWlsYWJsZS5cclxuICBfU2V0ID0gU2V0XHJcbn0gZWxzZSB7XHJcbiAgLy8gYSBub24tc3RhbmRhcmQgU2V0IHBvbHlmaWxsIHRoYXQgb25seSB3b3JrcyB3aXRoIHByaW1pdGl2ZSBrZXlzLlxyXG4gIF9TZXQgPSBjbGFzcyBTZXQge1xyXG4gICAgY29uc3RydWN0b3IgKCkge1xyXG4gICAgICB0aGlzLnNldCA9IE9iamVjdC5jcmVhdGUobnVsbClcclxuICAgIH1cclxuICAgIGhhcyAoa2V5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldFtrZXldICE9PSB1bmRlZmluZWRcclxuICAgIH1cclxuICAgIGFkZCAoa2V5KSB7XHJcbiAgICAgIHRoaXMuc2V0W2tleV0gPSAxXHJcbiAgICB9XHJcbiAgICBjbGVhciAoKSB7XHJcbiAgICAgIHRoaXMuc2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IHsgX1NldCB9XHJcblxyXG4vKipcclxuICogQ2hlY2sgaWYgYSBzdHJpbmcgc3RhcnRzIHdpdGggJCBvciBfXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNSZXNlcnZlZCAoc3RyKSB7XHJcbiAgY29uc3QgYyA9IChzdHIgKyAnJykuY2hhckNvZGVBdCgwKVxyXG4gIHJldHVybiBjID09PSAweDI0IHx8IGMgPT09IDB4NUZcclxufVxyXG5cclxuIiwiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgcmVtb3ZlIH0gZnJvbSAnLi91dGlsJ1xuXG5sZXQgdWlkID0gMFxuXG4vKipcbiAqIEEgZGVwIGlzIGFuIG9ic2VydmFibGUgdGhhdCBjYW4gaGF2ZSBtdWx0aXBsZVxuICogZGlyZWN0aXZlcyBzdWJzY3JpYmluZyB0byBpdC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVwIHtcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5pZCA9IHVpZCsrXG4gICAgdGhpcy5zdWJzID0gW11cbiAgfVxuXG4gIGFkZFN1YiAoc3ViKSB7XG4gICAgdGhpcy5zdWJzLnB1c2goc3ViKVxuICB9XG5cbiAgcmVtb3ZlU3ViIChzdWIpIHtcbiAgICByZW1vdmUodGhpcy5zdWJzLCBzdWIpXG4gIH1cblxuICBkZXBlbmQgKCkge1xuICAgIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgICBEZXAudGFyZ2V0LmFkZERlcCh0aGlzKVxuICAgIH1cbiAgfVxuXG4gIG5vdGlmeSAoKSB7XG4gICAgLy8gc3RhYmxpemUgdGhlIHN1YnNjcmliZXIgbGlzdCBmaXJzdFxuICAgIGNvbnN0IHN1YnMgPSB0aGlzLnN1YnMuc2xpY2UoKVxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gc3Vicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHN1YnNbaV0udXBkYXRlKClcbiAgICB9XG4gIH1cbn1cblxuLy8gdGhlIGN1cnJlbnQgdGFyZ2V0IHdhdGNoZXIgYmVpbmcgZXZhbHVhdGVkLlxuLy8gdGhpcyBpcyBnbG9iYWxseSB1bmlxdWUgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvbmx5IG9uZVxuLy8gd2F0Y2hlciBiZWluZyBldmFsdWF0ZWQgYXQgYW55IHRpbWUuXG5EZXAudGFyZ2V0ID0gbnVsbFxuY29uc3QgdGFyZ2V0U3RhY2sgPSBbXVxuXG5leHBvcnQgZnVuY3Rpb24gcHVzaFRhcmdldCAoX3RhcmdldCkge1xuICBpZiAoRGVwLnRhcmdldCkgdGFyZ2V0U3RhY2sucHVzaChEZXAudGFyZ2V0KVxuICBEZXAudGFyZ2V0ID0gX3RhcmdldFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9wVGFyZ2V0ICgpIHtcbiAgRGVwLnRhcmdldCA9IHRhcmdldFN0YWNrLnBvcCgpXG59XG4iLCIvKlxuICogbm90IHR5cGUgY2hlY2tpbmcgdGhpcyBmaWxlIGJlY2F1c2UgZmxvdyBkb2Vzbid0IHBsYXkgd2VsbCB3aXRoXG4gKiBkeW5hbWljYWxseSBhY2Nlc3NpbmcgbWV0aG9kcyBvbiBBcnJheSBwcm90b3R5cGVcbiAqL1xuXG5pbXBvcnQgeyBkZWYgfSBmcm9tICcuL3V0aWwnXG5cbmNvbnN0IGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGVcbmV4cG9ydCBjb25zdCBhcnJheU1ldGhvZHMgPSBPYmplY3QuY3JlYXRlKGFycmF5UHJvdG8pXG5cbi8qKlxuICogSW50ZXJjZXB0IG11dGF0aW5nIG1ldGhvZHMgYW5kIGVtaXQgZXZlbnRzXG4gKi9cbjtbXG4gICdwdXNoJyxcbiAgJ3BvcCcsXG4gICdzaGlmdCcsXG4gICd1bnNoaWZ0JyxcbiAgJ3NwbGljZScsXG4gICdzb3J0JyxcbiAgJ3JldmVyc2UnXG5dXG4uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gIC8vIGNhY2hlIG9yaWdpbmFsIG1ldGhvZFxuICBjb25zdCBvcmlnaW5hbCA9IGFycmF5UHJvdG9bbWV0aG9kXVxuICBkZWYoYXJyYXlNZXRob2RzLCBtZXRob2QsIGZ1bmN0aW9uIG11dGF0b3IgKCkge1xuICAgIC8vIGF2b2lkIGxlYWtpbmcgYXJndW1lbnRzOlxuICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2Nsb3N1cmUtd2l0aC1hcmd1bWVudHNcbiAgICBsZXQgaSA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICBjb25zdCBhcmdzID0gbmV3IEFycmF5KGkpXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKVxuICAgIGNvbnN0IG9iID0gdGhpcy5fX29iX19cbiAgICBsZXQgaW5zZXJ0ZWRcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgIGluc2VydGVkID0gYXJnc1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAndW5zaGlmdCc6XG4gICAgICAgIGluc2VydGVkID0gYXJnc1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnc3BsaWNlJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzLnNsaWNlKDIpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICAgIGlmIChpbnNlcnRlZCkgb2Iub2JzZXJ2ZUFycmF5KGluc2VydGVkKVxuICAgIC8vIG5vdGlmeSBjaGFuZ2VcbiAgICBvYi5kZXAubm90aWZ5KClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0pXG59KVxuIiwiLyogQGZsb3cgKi9cblxuaW1wb3J0IERlcCBmcm9tICcuL2RlcCdcbmltcG9ydCB7IGFycmF5TWV0aG9kcyB9IGZyb20gJy4vYXJyYXknXG5pbXBvcnQge1xuICBkZWYsXG4gIGlzT2JqZWN0LFxuICBpc1BsYWluT2JqZWN0LFxuICBoYXNQcm90byxcbiAgaGFzT3duLFxuICB3YXJuXG59IGZyb20gJy4vdXRpbCdcblxuY29uc3QgYXJyYXlLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYXJyYXlNZXRob2RzKVxuXG4vKipcbiAqIEJ5IGRlZmF1bHQsIHdoZW4gYSByZWFjdGl2ZSBwcm9wZXJ0eSBpcyBzZXQsIHRoZSBuZXcgdmFsdWUgaXNcbiAqIGFsc28gY29udmVydGVkIHRvIGJlY29tZSByZWFjdGl2ZS4gSG93ZXZlciB3aGVuIHBhc3NpbmcgZG93biBwcm9wcyxcbiAqIHdlIGRvbid0IHdhbnQgdG8gZm9yY2UgY29udmVyc2lvbiBiZWNhdXNlIHRoZSB2YWx1ZSBtYXkgYmUgYSBuZXN0ZWQgdmFsdWVcbiAqIHVuZGVyIGEgZnJvemVuIGRhdGEgc3RydWN0dXJlLiBDb252ZXJ0aW5nIGl0IHdvdWxkIGRlZmVhdCB0aGUgb3B0aW1pemF0aW9uLlxuICovXG5leHBvcnQgY29uc3Qgb2JzZXJ2ZXJTdGF0ZSA9IHtcbiAgc2hvdWxkQ29udmVydDogdHJ1ZSxcbiAgaXNTZXR0aW5nUHJvcHM6IGZhbHNlXG59XG5cbi8qKlxuICogT2JzZXJ2ZXIgY2xhc3MgdGhhdCBhcmUgYXR0YWNoZWQgdG8gZWFjaCBvYnNlcnZlZFxuICogb2JqZWN0LiBPbmNlIGF0dGFjaGVkLCB0aGUgb2JzZXJ2ZXIgY29udmVydHMgdGFyZ2V0XG4gKiBvYmplY3QncyBwcm9wZXJ0eSBrZXlzIGludG8gZ2V0dGVyL3NldHRlcnMgdGhhdFxuICogY29sbGVjdCBkZXBlbmRlbmNpZXMgYW5kIGRpc3BhdGNoZXMgdXBkYXRlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE9ic2VydmVyIHtcblxuICBjb25zdHJ1Y3RvciAodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmRlcCA9IG5ldyBEZXAoKVxuICAgIHRoaXMudm1Db3VudCA9IDBcbiAgICBkZWYodmFsdWUsICdfX29iX18nLCB0aGlzKVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgY29uc3QgYXVnbWVudCA9IGhhc1Byb3RvXG4gICAgICAgID8gcHJvdG9BdWdtZW50XG4gICAgICAgIDogY29weUF1Z21lbnRcbiAgICAgIGF1Z21lbnQodmFsdWUsIGFycmF5TWV0aG9kcywgYXJyYXlLZXlzKVxuICAgICAgdGhpcy5vYnNlcnZlQXJyYXkodmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMud2Fsayh2YWx1ZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2FsayB0aHJvdWdoIGVhY2ggcHJvcGVydHkgYW5kIGNvbnZlcnQgdGhlbSBpbnRvXG4gICAqIGdldHRlci9zZXR0ZXJzLiBUaGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlblxuICAgKiB2YWx1ZSB0eXBlIGlzIE9iamVjdC5cbiAgICovXG4gIHdhbGsgKG9iaikge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWZpbmVSZWFjdGl2ZShvYmosIGtleXNbaV0sIG9ialtrZXlzW2ldXSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZSBhIGxpc3Qgb2YgQXJyYXkgaXRlbXMuXG4gICAqL1xuICBvYnNlcnZlQXJyYXkgKGl0ZW1zKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIG9ic2VydmUoaXRlbXNbaV0pXG4gICAgfVxuICB9XG59XG5cbi8vIGhlbHBlcnNcblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgaW50ZXJjZXB0aW5nXG4gKiB0aGUgcHJvdG90eXBlIGNoYWluIHVzaW5nIF9fcHJvdG9fX1xuICovXG5mdW5jdGlvbiBwcm90b0F1Z21lbnQgKHRhcmdldCwgc3JjKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG4gIHRhcmdldC5fX3Byb3RvX18gPSBzcmNcbiAgLyogZXNsaW50LWVuYWJsZSBuby1wcm90byAqL1xufVxuXG4vKipcbiAqIEF1Z21lbnQgYW4gdGFyZ2V0IE9iamVjdCBvciBBcnJheSBieSBkZWZpbmluZ1xuICogaGlkZGVuIHByb3BlcnRpZXMuXG4gKlxuICogaXN0YW5idWwgaWdub3JlIG5leHRcbiAqL1xuZnVuY3Rpb24gY29weUF1Z21lbnQgKHRhcmdldCwgc3JjLCBrZXlzKSB7XG4gIGZvciAobGV0IGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBrZXlzW2ldXG4gICAgZGVmKHRhcmdldCwga2V5LCBzcmNba2V5XSlcbiAgfVxufVxuXG4vKipcbiAqIEF0dGVtcHQgdG8gY3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlIGZvciBhIHZhbHVlLFxuICogcmV0dXJucyB0aGUgbmV3IG9ic2VydmVyIGlmIHN1Y2Nlc3NmdWxseSBvYnNlcnZlZCxcbiAqIG9yIHRoZSBleGlzdGluZyBvYnNlcnZlciBpZiB0aGUgdmFsdWUgYWxyZWFkeSBoYXMgb25lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZSAodmFsdWUpe1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVyblxuICB9XG4gIGxldCBvYlxuICBpZiAoaGFzT3duKHZhbHVlLCAnX19vYl9fJykgJiYgdmFsdWUuX19vYl9fIGluc3RhbmNlb2YgT2JzZXJ2ZXIpIHtcbiAgICBvYiA9IHZhbHVlLl9fb2JfX1xuICB9IGVsc2UgaWYgKFxuICAgIG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydCAmJlxuICAgIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCBpc1BsYWluT2JqZWN0KHZhbHVlKSkgJiZcbiAgICBPYmplY3QuaXNFeHRlbnNpYmxlKHZhbHVlKSAmJlxuICAgICF2YWx1ZS5faXNWdWVcbiAgKSB7XG4gICAgb2IgPSBuZXcgT2JzZXJ2ZXIodmFsdWUpXG4gIH1cbiAgcmV0dXJuIG9iXG59XG5cbi8qKlxuICogRGVmaW5lIGEgcmVhY3RpdmUgcHJvcGVydHkgb24gYW4gT2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lUmVhY3RpdmUgKFxuICBvYmosXG4gIGtleSxcbiAgdmFsLFxuICBjdXN0b21TZXR0ZXJcbikge1xuICBjb25zdCBkZXAgPSBuZXcgRGVwKClcblxuICBjb25zdCBwcm9wZXJ0eSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gIGlmIChwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5jb25maWd1cmFibGUgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBjYXRlciBmb3IgcHJlLWRlZmluZWQgZ2V0dGVyL3NldHRlcnNcbiAgY29uc3QgZ2V0dGVyID0gcHJvcGVydHkgJiYgcHJvcGVydHkuZ2V0XG4gIGNvbnN0IHNldHRlciA9IHByb3BlcnR5ICYmIHByb3BlcnR5LnNldFxuXG4gIGxldCBjaGlsZE9iID0gb2JzZXJ2ZSh2YWwpXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gcmVhY3RpdmVHZXR0ZXIgKCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsXG4gICAgICBpZiAoRGVwLnRhcmdldCkge1xuICAgICAgICBkZXAuZGVwZW5kKClcbiAgICAgICAgaWYgKGNoaWxkT2IpIHtcbiAgICAgICAgICBjaGlsZE9iLmRlcC5kZXBlbmQoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGRlcGVuZEFycmF5KHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gcmVhY3RpdmVTZXR0ZXIgKG5ld1ZhbCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsXG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbiAgICAgIGlmIChuZXdWYWwgPT09IHZhbHVlIHx8IChuZXdWYWwgIT09IG5ld1ZhbCAmJiB2YWx1ZSAhPT0gdmFsdWUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGN1c3RvbVNldHRlcikge1xuICAgICAgICBjdXN0b21TZXR0ZXIoKVxuICAgICAgfVxuICAgICAgaWYgKHNldHRlcikge1xuICAgICAgICBzZXR0ZXIuY2FsbChvYmosIG5ld1ZhbClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbCA9IG5ld1ZhbFxuICAgICAgfVxuICAgICAgY2hpbGRPYiA9IG9ic2VydmUobmV3VmFsKVxuICAgICAgZGVwLm5vdGlmeSgpXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIFNldCBhIHByb3BlcnR5IG9uIGFuIG9iamVjdC4gQWRkcyB0aGUgbmV3IHByb3BlcnR5IGFuZFxuICogdHJpZ2dlcnMgY2hhbmdlIG5vdGlmaWNhdGlvbiBpZiB0aGUgcHJvcGVydHkgZG9lc24ndFxuICogYWxyZWFkeSBleGlzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldCAob2JqLCBrZXksIHZhbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgb2JqLmxlbmd0aCA9IE1hdGgubWF4KG9iai5sZW5ndGgsIGtleSlcbiAgICBvYmouc3BsaWNlKGtleSwgMSwgdmFsKVxuICAgIHJldHVybiB2YWxcbiAgfVxuICBpZiAoaGFzT3duKG9iaiwga2V5KSkge1xuICAgIG9ialtrZXldID0gdmFsXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3Qgb2IgPSBvYmouX19vYl9fXG4gIGlmIChvYmouX2lzVnVlIHx8IChvYiAmJiBvYi52bUNvdW50KSkge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICdBdm9pZCBhZGRpbmcgcmVhY3RpdmUgcHJvcGVydGllcyB0byBhIFZ1ZSBpbnN0YW5jZSBvciBpdHMgcm9vdCAkZGF0YSAnICtcbiAgICAgICdhdCBydW50aW1lIC0gZGVjbGFyZSBpdCB1cGZyb250IGluIHRoZSBkYXRhIG9wdGlvbi4nXG4gICAgKVxuICAgIHJldHVyblxuICB9XG4gIGlmICghb2IpIHtcbiAgICBvYmpba2V5XSA9IHZhbFxuICAgIHJldHVyblxuICB9XG4gIGRlZmluZVJlYWN0aXZlKG9iLnZhbHVlLCBrZXksIHZhbClcbiAgb2IuZGVwLm5vdGlmeSgpXG4gIHJldHVybiB2YWxcbn1cblxuLyoqXG4gKiBEZWxldGUgYSBwcm9wZXJ0eSBhbmQgdHJpZ2dlciBjaGFuZ2UgaWYgbmVjZXNzYXJ5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsIChvYmosIGtleSkge1xuICBjb25zdCBvYiA9IG9iai5fX29iX19cbiAgaWYgKG9iai5faXNWdWUgfHwgKG9iICYmIG9iLnZtQ291bnQpKSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgJ0F2b2lkIGRlbGV0aW5nIHByb3BlcnRpZXMgb24gYSBWdWUgaW5zdGFuY2Ugb3IgaXRzIHJvb3QgJGRhdGEgJyArXG4gICAgICAnLSBqdXN0IHNldCBpdCB0byBudWxsLidcbiAgICApXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCFoYXNPd24ob2JqLCBrZXkpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgZGVsZXRlIG9ialtrZXldXG4gIGlmICghb2IpIHtcbiAgICByZXR1cm5cbiAgfVxuICBvYi5kZXAubm90aWZ5KClcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGRlcGVuZGVuY2llcyBvbiBhcnJheSBlbGVtZW50cyB3aGVuIHRoZSBhcnJheSBpcyB0b3VjaGVkLCBzaW5jZVxuICogd2UgY2Fubm90IGludGVyY2VwdCBhcnJheSBlbGVtZW50IGFjY2VzcyBsaWtlIHByb3BlcnR5IGdldHRlcnMuXG4gKi9cbmZ1bmN0aW9uIGRlcGVuZEFycmF5ICh2YWx1ZSkge1xuICBmb3IgKGxldCBlLCBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGUgPSB2YWx1ZVtpXVxuICAgIGUgJiYgZS5fX29iX18gJiYgZS5fX29iX18uZGVwLmRlcGVuZCgpXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZSkpIHtcbiAgICAgIGRlcGVuZEFycmF5KGUpXG4gICAgfVxuICB9XG59XG4iLCIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgRGVwLCB7IHB1c2hUYXJnZXQsIHBvcFRhcmdldCB9IGZyb20gJy4vZGVwJ1xuaW1wb3J0IHtcbiAgd2FybixcbiAgcmVtb3ZlLFxuICBpc09iamVjdCxcbiAgcGFyc2VQYXRoLFxuICBfU2V0IGFzIFNldFxufSBmcm9tICcuL3V0aWwnXG5cbmxldCB1aWQgPSAwXG5cbi8qKlxuICogQSB3YXRjaGVyIHBhcnNlcyBhbiBleHByZXNzaW9uLCBjb2xsZWN0cyBkZXBlbmRlbmNpZXMsXG4gKiBhbmQgZmlyZXMgY2FsbGJhY2sgd2hlbiB0aGUgZXhwcmVzc2lvbiB2YWx1ZSBjaGFuZ2VzLlxuICogVGhpcyBpcyB1c2VkIGZvciBib3RoIHRoZSAkd2F0Y2goKSBhcGkgYW5kIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhdGNoZXIge1xuXG4gIGNvbnN0cnVjdG9yIChcbiAgICB2bSxcbiAgICBleHBPckZuLFxuICAgIGNiLFxuICAgIG9wdGlvbnMgPSB7fVxuICApIHtcbiAgICB0aGlzLnZtID0gdm1cbiAgICB2bS5fd2F0Y2hlcnMucHVzaCh0aGlzKVxuICAgIC8vIG9wdGlvbnNcbiAgICB0aGlzLmRlZXAgPSAhIW9wdGlvbnMuZGVlcFxuICAgIHRoaXMudXNlciA9ICEhb3B0aW9ucy51c2VyXG4gICAgdGhpcy5sYXp5ID0gZmFsc2UvL+Wkh+eUqFxuICAgIHRoaXMuc3luYyA9IHRydWUgLy/lpIfnlKhcbiAgICB0aGlzLmV4cHJlc3Npb24gPSBleHBPckZuLnRvU3RyaW5nKClcbiAgICB0aGlzLmNiID0gY2JcbiAgICB0aGlzLmlkID0gKyt1aWQgLy8gdWlkIGZvciBiYXRjaGluZ1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxuICAgIHRoaXMuZGlydHkgPSB0aGlzLmxhenkgLy8gZm9yIGxhenkgd2F0Y2hlcnNcbiAgICB0aGlzLmRlcHMgPSBbXVxuICAgIHRoaXMubmV3RGVwcyA9IFtdXG4gICAgdGhpcy5kZXBJZHMgPSBuZXcgU2V0KClcbiAgICB0aGlzLm5ld0RlcElkcyA9IG5ldyBTZXQoKVxuICAgIC8vIHBhcnNlIGV4cHJlc3Npb24gZm9yIGdldHRlclxuICAgIGlmICh0eXBlb2YgZXhwT3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5nZXR0ZXIgPSBleHBPckZuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2V0dGVyID0gcGFyc2VQYXRoKGV4cE9yRm4pXG4gICAgICBpZiAoIXRoaXMuZ2V0dGVyKSB7XG4gICAgICAgIHRoaXMuZ2V0dGVyID0gZnVuY3Rpb24gKCkge31cbiAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICAgIGBGYWlsZWQgd2F0Y2hpbmcgcGF0aDogXCIke2V4cE9yRm59XCIgYCArXG4gICAgICAgICAgJ1dhdGNoZXIgb25seSBhY2NlcHRzIHNpbXBsZSBkb3QtZGVsaW1pdGVkIHBhdGhzLiAnICtcbiAgICAgICAgICAnRm9yIGZ1bGwgY29udHJvbCwgdXNlIGEgZnVuY3Rpb24gaW5zdGVhZC4nLFxuICAgICAgICAgIHZtXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy52YWx1ZSA9IHRoaXMubGF6eVxuICAgICAgPyB1bmRlZmluZWRcbiAgICAgIDogdGhpcy5nZXQoKVxuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlIHRoZSBnZXR0ZXIsIGFuZCByZS1jb2xsZWN0IGRlcGVuZGVuY2llcy5cbiAgICovXG4gIGdldCAoKSB7XG4gICAgcHVzaFRhcmdldCh0aGlzKVxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXR0ZXIuY2FsbCh0aGlzLnZtLCB0aGlzLnZtKVxuICAgIC8vIFwidG91Y2hcIiBldmVyeSBwcm9wZXJ0eSBzbyB0aGV5IGFyZSBhbGwgdHJhY2tlZCBhc1xuICAgIC8vIGRlcGVuZGVuY2llcyBmb3IgZGVlcCB3YXRjaGluZ1xuICAgIGlmICh0aGlzLmRlZXApIHtcbiAgICAgIHRyYXZlcnNlKHZhbHVlKVxuICAgIH1cbiAgICBwb3BUYXJnZXQoKVxuICAgIHRoaXMuY2xlYW51cERlcHMoKVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGRlcGVuZGVuY3kgdG8gdGhpcyBkaXJlY3RpdmUuXG4gICAqL1xuICBhZGREZXAgKGRlcCkge1xuICAgIGNvbnN0IGlkID0gZGVwLmlkXG4gICAgaWYgKCF0aGlzLm5ld0RlcElkcy5oYXMoaWQpKSB7XG4gICAgICB0aGlzLm5ld0RlcElkcy5hZGQoaWQpXG4gICAgICB0aGlzLm5ld0RlcHMucHVzaChkZXApXG4gICAgICBpZiAoIXRoaXMuZGVwSWRzLmhhcyhpZCkpIHtcbiAgICAgICAgZGVwLmFkZFN1Yih0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbiB1cCBmb3IgZGVwZW5kZW5jeSBjb2xsZWN0aW9uLlxuICAgKi9cbiAgY2xlYW51cERlcHMgKCkge1xuICAgIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IGRlcCA9IHRoaXMuZGVwc1tpXVxuICAgICAgaWYgKCF0aGlzLm5ld0RlcElkcy5oYXMoZGVwLmlkKSkge1xuICAgICAgICBkZXAucmVtb3ZlU3ViKHRoaXMpXG4gICAgICB9XG4gICAgfVxuICAgIGxldCB0bXAgPSB0aGlzLmRlcElkc1xuICAgIHRoaXMuZGVwSWRzID0gdGhpcy5uZXdEZXBJZHNcbiAgICB0aGlzLm5ld0RlcElkcyA9IHRtcFxuICAgIHRoaXMubmV3RGVwSWRzLmNsZWFyKClcbiAgICB0bXAgPSB0aGlzLmRlcHNcbiAgICB0aGlzLmRlcHMgPSB0aGlzLm5ld0RlcHNcbiAgICB0aGlzLm5ld0RlcHMgPSB0bXBcbiAgICB0aGlzLm5ld0RlcHMubGVuZ3RoID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZXIgaW50ZXJmYWNlLlxuICAgKiBXaWxsIGJlIGNhbGxlZCB3aGVuIGEgZGVwZW5kZW5jeSBjaGFuZ2VzLlxuICAgKi9cbiAgdXBkYXRlICgpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmICh0aGlzLmxhenkpIHtcbiAgICAgIHRoaXMuZGlydHkgPSB0cnVlXG4gICAgfSBlbHNlIGlmICh0aGlzLnN5bmMpIHtcbiAgICAgIHRoaXMucnVuKClcbiAgICB9IFxuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlciBqb2IgaW50ZXJmYWNlLlxuICAgKiBXaWxsIGJlIGNhbGxlZCBieSB0aGUgc2NoZWR1bGVyLlxuICAgKi9cbiAgcnVuICgpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXQoKVxuICAgICAgaWYgKFxuICAgICAgICB2YWx1ZSAhPT0gdGhpcy52YWx1ZSB8fFxuICAgICAgICAvLyBEZWVwIHdhdGNoZXJzIGFuZCB3YXRjaGVycyBvbiBPYmplY3QvQXJyYXlzIHNob3VsZCBmaXJlIGV2ZW5cbiAgICAgICAgLy8gd2hlbiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUsIGJlY2F1c2UgdGhlIHZhbHVlIG1heVxuICAgICAgICAvLyBoYXZlIG11dGF0ZWQuXG4gICAgICAgIGlzT2JqZWN0KHZhbHVlKSB8fFxuICAgICAgICB0aGlzLmRlZXBcbiAgICAgICkge1xuICAgICAgICAvLyBzZXQgbmV3IHZhbHVlXG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy52YWx1ZVxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGUgdGhlIHZhbHVlIG9mIHRoZSB3YXRjaGVyLlxuICAgKiBUaGlzIG9ubHkgZ2V0cyBjYWxsZWQgZm9yIGxhenkgd2F0Y2hlcnMuXG4gICAqIGJhY2tcbiAgICovXG4gIC8qZXZhbHVhdGUgKCkge1xuICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldCgpXG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlXG4gIH0qL1xuXG4gIC8qKlxuICAgKiBEZXBlbmQgb24gYWxsIGRlcHMgY29sbGVjdGVkIGJ5IHRoaXMgd2F0Y2hlci5cbiAgICogYmFja1xuICAgKi9cbiAgLypkZXBlbmQgKCkge1xuICAgIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHRoaXMuZGVwc1tpXS5kZXBlbmQoKVxuICAgIH1cbiAgfSovXG5cbiAgLyoqXG4gICAqIFJlbW92ZSBzZWxmIGZyb20gYWxsIGRlcGVuZGVuY2llcycgc3Vic2NyaWJlciBsaXN0LlxuICAgKi9cbiAgdGVhcmRvd24gKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgICAgLy8gcmVtb3ZlIHNlbGYgZnJvbSB2bSdzIHdhdGNoZXIgbGlzdFxuICAgICAgLy8gdGhpcyBpcyBhIHNvbWV3aGF0IGV4cGVuc2l2ZSBvcGVyYXRpb24gc28gd2Ugc2tpcCBpdFxuICAgICAgLy8gaWYgdGhlIHZtIGlzIGJlaW5nIGRlc3Ryb3llZCBvciBpcyBwZXJmb3JtaW5nIGEgdi1mb3JcbiAgICAgIC8vIHJlLXJlbmRlciAodGhlIHdhdGNoZXIgbGlzdCBpcyB0aGVuIGZpbHRlcmVkIGJ5IHYtZm9yKS5cbiAgICAgIGlmICghdGhpcy52bS5faXNCZWluZ0Rlc3Ryb3llZCAmJiAhdGhpcy52bS5fdkZvclJlbW92aW5nKSB7XG4gICAgICAgIHJlbW92ZSh0aGlzLnZtLl93YXRjaGVycywgdGhpcylcbiAgICAgIH1cbiAgICAgIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICB0aGlzLmRlcHNbaV0ucmVtb3ZlU3ViKHRoaXMpXG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgdHJhdmVyc2UgYW4gb2JqZWN0IHRvIGV2b2tlIGFsbCBjb252ZXJ0ZWRcbiAqIGdldHRlcnMsIHNvIHRoYXQgZXZlcnkgbmVzdGVkIHByb3BlcnR5IGluc2lkZSB0aGUgb2JqZWN0XG4gKiBpcyBjb2xsZWN0ZWQgYXMgYSBcImRlZXBcIiBkZXBlbmRlbmN5LlxuICovXG5jb25zdCBzZWVuT2JqZWN0cyA9IG5ldyBTZXQoKVxuZnVuY3Rpb24gdHJhdmVyc2UgKHZhbCkge1xuICBzZWVuT2JqZWN0cy5jbGVhcigpXG4gIF90cmF2ZXJzZSh2YWwsIHNlZW5PYmplY3RzKVxufVxuXG5mdW5jdGlvbiBfdHJhdmVyc2UgKHZhbCwgc2Vlbikge1xuICBsZXQgaSwga2V5c1xuICBjb25zdCBpc0EgPSBBcnJheS5pc0FycmF5KHZhbClcbiAgaWYgKCghaXNBICYmICFpc09iamVjdCh2YWwpKSB8fCAhT2JqZWN0LmlzRXh0ZW5zaWJsZSh2YWwpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHZhbC5fX29iX18pIHtcbiAgICBjb25zdCBkZXBJZCA9IHZhbC5fX29iX18uZGVwLmlkXG4gICAgaWYgKHNlZW4uaGFzKGRlcElkKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHNlZW4uYWRkKGRlcElkKVxuICB9XG4gIGlmIChpc0EpIHtcbiAgICBpID0gdmFsLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIF90cmF2ZXJzZSh2YWxbaV0sIHNlZW4pXG4gIH0gZWxzZSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbClcbiAgICBpID0ga2V5cy5sZW5ndGhcbiAgICB3aGlsZSAoaS0tKSBfdHJhdmVyc2UodmFsW2tleXNbaV1dLCBzZWVuKVxuICB9XG59XG4iLCJcclxuaW1wb3J0IHtvYnNlcnZlLE9ic2VydmVyLHNldCxkZWx9IGZyb20gJy4vb2JzZXJ2ZS5qcydcclxuaW1wb3J0IFdhdGNoZXIgZnJvbSAnLi93YXRjaGVyLmpzJ1xyXG5pbXBvcnQge2lzUmVzZXJ2ZWQsaXNQbGFpbk9iamVjdCx3YXJuLGhhc093bn0gZnJvbSAnLi91dGlsLmpzJ1xyXG5cclxuZnVuY3Rpb24gaW5pdERhdGEodm0sIGRhdGEpIHtcclxuICAgIGlmICghaXNQbGFpbk9iamVjdChkYXRhKSkge1xyXG4gICAgICBkYXRhID0ge31cclxuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxyXG4gICAgICAgICdkYXRhIHNob3VsZCBiZSBhbiBwbGFpbiBvYmplY3QuJyxcclxuICAgICAgICB2bVxyXG4gICAgICApXHJcbiAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHJveHkgZGF0YSBvbiBpbnN0YW5jZVxyXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpXHJcbiAgICBsZXQgaSA9IGtleXMubGVuZ3RoXHJcbiAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgcHJveHkodm0sIGtleXNbaV0pXHJcbiAgICB9XHJcbiAgICAvLyBvYnNlcnZlIGRhdGFcclxuICAgIG9ic2VydmUoZGF0YSlcclxuICAgIGRhdGEuX19vYl9fICYmIGRhdGEuX19vYl9fLnZtQ291bnQrK1xyXG4gICAgdm0uX2RhdGEgPSBkYXRhO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm94eSh2bSwga2V5KSB7XHJcbiAgICBpZiAoIWlzUmVzZXJ2ZWQoa2V5KSkge1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwga2V5LCB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBwcm94eUdldHRlcigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2bS5fZGF0YVtrZXldXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gcHJveHlTZXR0ZXIodmFsKSB7XHJcbiAgICAgICAgICAgICAgICB2bS5fZGF0YVtrZXldID0gdmFsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBPYihvYmopIHtcclxuICAgIHRoaXMuX3dhdGNoZXJzID0gW107XHJcbiAgICBpbml0RGF0YSh0aGlzLCBvYmopO1xyXG4gICAgdGhpcy5faXNJbml0ZWQgPSAhIXRoaXMuX2RhdGE7XHJcbiAgICB0aGlzLiRzZXQgPSBzZXQ7XHJcbiAgICB0aGlzLiRkZWwgPSBkZWw7XHJcblxyXG4gICAgdGhpcy53YXRjaCA9IGZ1bmN0aW9uIChnZXR0ZXIsIGNiLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIHdhdCA9IG5ldyBXYXRjaGVyKHRoaXMsIGdldHRlciwgY2IsIG9wdGlvbnMpO1xyXG4gICAgICAgIHJldHVybiB3YXQudGVhcmRvd24uYmluZCh3YXQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuT2IudmVyc2lvbiA9ICcxLjAuMCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPYjtcclxuXHJcblxyXG4iXSwibmFtZXMiOlsiY29uc3QiLCJsZXQiLCJhcmd1bWVudHMiLCJ1aWQiLCJTZXQiLCJ0aGlzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFNQSxBQUFPLFNBQVMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDakMsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO0lBQ2RBLElBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDL0IsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7TUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUM1QjtHQUNGO0NBQ0Y7Ozs7Ozs7QUFPRCxBQUFPLFNBQVMsUUFBUSxFQUFFLEdBQUcsRUFBRTtFQUM3QixPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtDQUMvQzs7Ozs7O0FBTURBLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFBO0FBQzFDQSxJQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQTtBQUN2QyxBQUFPLFNBQVMsYUFBYSxFQUFFLEdBQUcsRUFBRTtFQUNsQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssYUFBYTtDQUM1Qzs7Ozs7QUFLREEsSUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUE7QUFDdEQsQUFBTyxTQUFTLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0VBQ2hDLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0NBQ3JDOztBQUVEQSxJQUFNLFVBQVUsR0FBRyxPQUFPLE9BQU8sS0FBSyxXQUFXLENBQUE7QUFDakQsQUFBTyxTQUFTLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFO0lBQzFCLElBQUksVUFBVSxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssRUFBQyxhQUFZLEdBQUUsR0FBRyxNQUFFLEVBQUUsQ0FBQTtLQUN0QztDQUNKOzs7Ozs7QUFNRCxBQUFPLFNBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRTtFQUM5QyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDOUIsS0FBSyxFQUFFLEdBQUc7SUFDVixVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7SUFDeEIsUUFBUSxFQUFFLElBQUk7SUFDZCxZQUFZLEVBQUUsSUFBSTtHQUNuQixDQUFDLENBQUE7Q0FDSDs7Ozs7QUFLREEsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFBO0FBQ3hCLEFBQU8sU0FBUyxTQUFTLEVBQUUsSUFBSSxFQUFFO0VBQy9CLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNyQixNQUFNO0dBQ1AsTUFBTTtJQUNMQSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2hDLE9BQU8sVUFBVSxHQUFHLEVBQUU7TUFDcEIsS0FBS0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBQSxNQUFNLEVBQUE7UUFDaEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtPQUN2QjtNQUNELE9BQU8sR0FBRztLQUNYO0dBQ0Y7Q0FDRjs7QUFFRCxBQUFPRCxJQUFNLFFBQVEsR0FBRyxXQUFXLElBQUksRUFBRSxDQUFBOzs7OztBQUt6QyxTQUFTLFFBQVEsRUFBRSxJQUFJLEVBQUU7RUFDdkIsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztDQUMzQztBQUNEQyxJQUFJLElBQUksQ0FBQTs7QUFFUixJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVcsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7O0VBRS9DLElBQUksR0FBRyxHQUFHLENBQUE7Q0FDWCxNQUFNOztFQUVMLElBQUk7SUFBYSxZQUNKLElBQUk7TUFDYixJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDL0I7SUFDRCxjQUFBLEdBQUcsaUJBQUUsR0FBRyxFQUFFO01BQ1IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVM7S0FDbkMsQ0FBQTtJQUNELGNBQUEsR0FBRyxpQkFBRSxHQUFHLEVBQUU7TUFDUixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUNsQixDQUFBO0lBQ0QsY0FBQSxLQUFLLHFCQUFJO01BQ1AsSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQy9CLENBQUE7OztNQUNGLENBQUE7Q0FDRjs7QUFFRCxBQUtBLEFBQU8sU0FBUyxVQUFVLEVBQUUsR0FBRyxFQUFFO0VBQy9CRCxJQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFBO0VBQ2xDLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSTtDQUNoQzs7QUN4SEQ7O0FBRUEsQUFFQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBOzs7Ozs7QUFNWCxJQUFxQixHQUFHLEdBQUMsWUFFWixJQUFJO0VBQ2YsSUFBTSxDQUFDLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQTtFQUNqQixJQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtDQUNmLENBQUE7O0FBRUgsY0FBRSxNQUFNLG9CQUFFLEdBQUcsRUFBRTtFQUNiLElBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0NBQ3BCLENBQUE7O0FBRUgsY0FBRSxTQUFTLHVCQUFFLEdBQUcsRUFBRTtFQUNoQixNQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtDQUN2QixDQUFBOztBQUVILGNBQUUsTUFBTSxzQkFBSTtFQUNWLElBQU0sR0FBRyxDQUFDLE1BQU0sRUFBRTtJQUNoQixHQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtHQUN4QjtDQUNGLENBQUE7O0FBRUgsY0FBRSxNQUFNLHNCQUFJOztFQUVWLElBQVEsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7RUFDaEMsS0FBT0EsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDN0MsSUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO0dBQ2pCO0NBQ0YsQ0FBQTs7QUFNSCxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNqQkQsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFBOztBQUV0QixBQUFPLFNBQVMsVUFBVSxFQUFFLE9BQU8sRUFBRTtFQUNuQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBQSxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQSxFQUFBO0VBQzVDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFBO0NBQ3JCOztBQUVELEFBQU8sU0FBUyxTQUFTLElBQUk7RUFDM0IsR0FBRyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDL0I7O0FDckREOzs7OztBQUtBLEFBRUFBLElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUE7QUFDbEMsQUFBT0EsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FLcEQ7RUFDQyxNQUFNO0VBQ04sS0FBSztFQUNMLE9BQU87RUFDUCxTQUFTO0VBQ1QsUUFBUTtFQUNSLE1BQU07RUFDTixTQUFTO0NBQ1Y7Q0FDQSxPQUFPLENBQUMsVUFBVSxNQUFNLEVBQUU7O0VBRXpCQSxJQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7RUFDbkMsR0FBRyxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxPQUFPLElBQUk7Ozs7O0lBRzVDQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO0lBQ3hCRCxJQUFNLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN6QixPQUFPLENBQUMsRUFBRSxFQUFFO01BQ1YsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHRSxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDdkI7SUFDREYsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDekNBLElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDdEJDLElBQUksUUFBUSxDQUFBO0lBQ1osUUFBUSxNQUFNO01BQ1osS0FBSyxNQUFNO1FBQ1QsUUFBUSxHQUFHLElBQUksQ0FBQTtRQUNmLEtBQUs7TUFDUCxLQUFLLFNBQVM7UUFDWixRQUFRLEdBQUcsSUFBSSxDQUFBO1FBQ2YsS0FBSztNQUNQLEtBQUssUUFBUTtRQUNYLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3hCLEtBQUs7S0FDUjtJQUNELElBQUksUUFBUSxFQUFFLEVBQUEsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQSxFQUFBOztJQUV2QyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFBO0lBQ2YsT0FBTyxNQUFNO0dBQ2QsQ0FBQyxDQUFBO0NBQ0gsQ0FBQyxDQUFBOztBQ3BERjs7QUFFQSxBQUNBLEFBQ0EsQUFTQUQsSUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFBOzs7Ozs7OztBQVExRCxBQUFPQSxJQUFNLGFBQWEsR0FBRztFQUMzQixhQUFhLEVBQUUsSUFBSTtFQUNuQixjQUFjLEVBQUUsS0FBSztDQUN0QixDQUFBOzs7Ozs7OztBQVFELEFBQU8sSUFBTSxRQUFRLEdBQUMsaUJBRVQsRUFBRSxLQUFLLEVBQUU7RUFDcEIsSUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7RUFDcEIsSUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0VBQ3RCLElBQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFBO0VBQ2xCLEdBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFBO0VBQzVCLElBQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUMxQixJQUFRLE9BQU8sR0FBRyxRQUFRO1FBQ3BCLFlBQVk7UUFDWixXQUFXLENBQUE7SUFDakIsT0FBUyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDekMsSUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQTtHQUN6QixNQUFNO0lBQ1AsSUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtHQUNqQjtDQUNGLENBQUE7Ozs7Ozs7QUFPSCxtQkFBRSxJQUFJLGtCQUFFLEdBQUcsRUFBRTtFQUNYLElBQVEsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7RUFDL0IsS0FBT0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3RDLGNBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUMzQztDQUNGLENBQUE7Ozs7O0FBS0gsbUJBQUUsWUFBWSwwQkFBRSxLQUFLLEVBQUU7RUFDckIsS0FBT0EsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDOUMsT0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ2xCO0NBQ0YsQ0FBQTs7Ozs7Ozs7QUFTSCxTQUFTLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFOztFQUVsQyxNQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTs7Q0FFdkI7Ozs7Ozs7O0FBUUQsU0FBUyxXQUFXLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDdkMsS0FBS0EsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDM0NELElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNuQixHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtHQUMzQjtDQUNGOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLE9BQU8sRUFBRSxLQUFLLENBQUM7RUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNwQixNQUFNO0dBQ1A7RUFDREMsSUFBSSxFQUFFLENBQUE7RUFDTixJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sWUFBWSxRQUFRLEVBQUU7SUFDL0QsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7R0FDbEIsTUFBTTtJQUNMLGFBQWEsQ0FBQyxhQUFhO0tBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQzFCLENBQUMsS0FBSyxDQUFDLE1BQU07SUFDYjtJQUNBLEVBQUUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtHQUN6QjtFQUNELE9BQU8sRUFBRTtDQUNWOzs7OztBQUtELEFBQU8sU0FBUyxjQUFjO0VBQzVCLEdBQUc7RUFDSCxHQUFHO0VBQ0gsR0FBRztFQUNILFlBQVk7RUFDWjtFQUNBRCxJQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBOztFQUVyQkEsSUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtFQUMxRCxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsWUFBWSxLQUFLLEtBQUssRUFBRTtJQUMvQyxNQUFNO0dBQ1A7OztFQUdEQSxJQUFNLE1BQU0sR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQTtFQUN2Q0EsSUFBTSxNQUFNLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUE7O0VBRXZDQyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7RUFDMUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO0lBQzlCLFVBQVUsRUFBRSxJQUFJO0lBQ2hCLFlBQVksRUFBRSxJQUFJO0lBQ2xCLEdBQUcsRUFBRSxTQUFTLGNBQWMsSUFBSTtNQUM5QkQsSUFBTSxLQUFLLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO01BQzdDLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtRQUNkLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUNaLElBQUksT0FBTyxFQUFFO1VBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtTQUNyQjtRQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtVQUN4QixXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDbkI7T0FDRjtNQUNELE9BQU8sS0FBSztLQUNiO0lBQ0QsR0FBRyxFQUFFLFNBQVMsY0FBYyxFQUFFLE1BQU0sRUFBRTtNQUNwQ0EsSUFBTSxLQUFLLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBOztNQUU3QyxJQUFJLE1BQU0sS0FBSyxLQUFLLEtBQUssTUFBTSxLQUFLLE1BQU0sSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDOUQsTUFBTTtPQUNQOztNQUVELElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxJQUFJLFlBQVksRUFBRTtRQUN6RCxZQUFZLEVBQUUsQ0FBQTtPQUNmO01BQ0QsSUFBSSxNQUFNLEVBQUU7UUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtPQUN6QixNQUFNO1FBQ0wsR0FBRyxHQUFHLE1BQU0sQ0FBQTtPQUNiO01BQ0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtNQUN6QixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUE7S0FDYjtHQUNGLENBQUMsQ0FBQTtDQUNIOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNsQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDdEIsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDdEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3ZCLE9BQU8sR0FBRztHQUNYO0VBQ0QsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7SUFDZCxNQUFNO0dBQ1A7RUFDREEsSUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtFQUNyQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxZQUFZLElBQUksSUFBSTtNQUMzQyx1RUFBdUU7TUFDdkUscURBQXFEO0tBQ3RELENBQUE7SUFDRCxNQUFNO0dBQ1A7RUFDRCxJQUFJLENBQUMsRUFBRSxFQUFFO0lBQ1AsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtJQUNkLE1BQU07R0FDUDtFQUNELGNBQWMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtFQUNsQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFBO0VBQ2YsT0FBTyxHQUFHO0NBQ1g7Ozs7O0FBS0QsQUFBTyxTQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0VBQzdCQSxJQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0VBQ3JCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFlBQVksSUFBSSxJQUFJO01BQzNDLGdFQUFnRTtNQUNoRSx3QkFBd0I7S0FDekIsQ0FBQTtJQUNELE1BQU07R0FDUDtFQUNELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3JCLE1BQU07R0FDUDtFQUNELE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0VBQ2YsSUFBSSxDQUFDLEVBQUUsRUFBRTtJQUNQLE1BQU07R0FDUDtFQUNELEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUE7Q0FDaEI7Ozs7OztBQU1ELFNBQVMsV0FBVyxFQUFFLEtBQUssRUFBRTtFQUMzQixLQUFLQyxJQUFJLENBQUMsV0FBQSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMvQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ1osQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDdEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ3BCLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUNmO0dBQ0Y7Q0FDRjs7QUNwUEQ7O0FBRUEsQUFDQSxBQVFBQSxJQUFJRSxLQUFHLEdBQUcsQ0FBQyxDQUFBOzs7Ozs7O0FBT1gsSUFBcUIsT0FBTyxHQUFDLGdCQUVoQjtFQUNYLEVBQUk7RUFDSixPQUFTO0VBQ1QsRUFBSTtFQUNKLE9BQWM7RUFDWjttQ0FETyxHQUFHLEVBQUU7O0VBRWQsSUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUE7RUFDZCxFQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTs7RUFFekIsSUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtFQUM1QixJQUFNLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFBO0VBQzVCLElBQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFBO0VBQ25CLElBQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0VBQ2xCLElBQU0sQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFBO0VBQ3RDLElBQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFBO0VBQ2QsSUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFQSxLQUFHLENBQUE7RUFDakIsSUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7RUFDcEIsSUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO0VBQ3hCLElBQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFBO0VBQ2hCLElBQU0sQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBO0VBQ25CLElBQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSUMsSUFBRyxFQUFFLENBQUE7RUFDekIsSUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJQSxJQUFHLEVBQUUsQ0FBQTs7RUFFNUIsSUFBTSxPQUFPLE9BQU8sS0FBSyxVQUFVLEVBQUU7SUFDbkMsSUFBTSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUE7R0FDdEIsTUFBTTtJQUNQLElBQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2xDLElBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO01BQ2xCLElBQU0sQ0FBQyxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUE7TUFDOUIsT0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxJQUFJLElBQUk7UUFDN0MsMEJBQTBCLEdBQUUsT0FBTyxRQUFHO1FBQ3RDLG1EQUFxRDtRQUNyRCwyQ0FBNkM7UUFDN0MsRUFBSTtPQUNILENBQUE7S0FDRjtHQUNGO0VBQ0gsSUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSTtNQUNsQixTQUFTO01BQ1QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0NBQ2YsQ0FBQTs7Ozs7QUFLSCxrQkFBRSxHQUFHLG1CQUFJO0VBQ1AsVUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO0VBQ2xCLElBQVEsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBOzs7RUFHbEQsSUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2YsUUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQ2hCO0VBQ0gsU0FBVyxFQUFFLENBQUE7RUFDYixJQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7RUFDcEIsT0FBUyxLQUFLO0NBQ2IsQ0FBQTs7Ozs7QUFLSCxrQkFBRSxNQUFNLG9CQUFFLEdBQUcsRUFBRTtFQUNiLElBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUE7RUFDbkIsSUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3hCLElBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3hCLElBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtNQUMxQixHQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ2pCO0dBQ0Y7Q0FDRixDQUFBOzs7OztBQUtILGtCQUFFLFdBQVcsMkJBQUk7OztFQUNmLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO0VBQzFCLE9BQVMsQ0FBQyxFQUFFLEVBQUU7SUFDWixJQUFRLEdBQUcsR0FBR0MsTUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMxQixJQUFNLENBQUNBLE1BQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtNQUNqQyxHQUFLLENBQUMsU0FBUyxDQUFDQSxNQUFJLENBQUMsQ0FBQTtLQUNwQjtHQUNGO0VBQ0gsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtFQUN2QixJQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7RUFDOUIsSUFBTSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUE7RUFDdEIsSUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtFQUN4QixHQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtFQUNqQixJQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7RUFDMUIsSUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUE7RUFDcEIsSUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0NBQ3hCLENBQUE7Ozs7OztBQU1ILGtCQUFFLE1BQU0sc0JBQUk7O0VBRVYsSUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2YsSUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7R0FDbEIsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDdEIsSUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFBO0dBQ1g7Q0FDRixDQUFBOzs7Ozs7QUFNSCxrQkFBRSxHQUFHLG1CQUFJO0VBQ1AsSUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ2pCLElBQVEsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUMxQjtNQUNFLEtBQU8sS0FBSyxJQUFJLENBQUMsS0FBSzs7OztNQUl0QixRQUFVLENBQUMsS0FBSyxDQUFDO01BQ2pCLElBQU0sQ0FBQyxJQUFJO01BQ1Q7O01BRUYsSUFBUSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtNQUM3QixJQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtNQUNwQixJQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUN2QztHQUNGO0NBQ0YsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQkgsa0JBQUUsUUFBUSx3QkFBSTs7O0VBQ1osSUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFOzs7OztJQUtqQixJQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFO01BQzFELE1BQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtLQUNoQztJQUNILElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO0lBQzFCLE9BQVMsQ0FBQyxFQUFFLEVBQUU7TUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQ0EsTUFBSSxDQUFDLENBQUE7S0FDN0I7SUFDSCxJQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQTtHQUNwQjtDQUNGLENBQUE7O0FBUUhMLElBQU0sV0FBVyxHQUFHLElBQUlJLElBQUcsRUFBRSxDQUFBO0FBQzdCLFNBQVMsUUFBUSxFQUFFLEdBQUcsRUFBRTtFQUN0QixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUE7RUFDbkIsU0FBUyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQTtDQUM1Qjs7QUFFRCxTQUFTLFNBQVMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO0VBQzdCSCxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUE7RUFDWEQsSUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtFQUM5QixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ3pELE1BQU07R0FDUDtFQUNELElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtJQUNkQSxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUE7SUFDL0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO01BQ25CLE1BQU07S0FDUDtJQUNELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7R0FDaEI7RUFDRCxJQUFJLEdBQUcsRUFBRTtJQUNQLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0lBQ2QsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFBLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUEsRUFBQTtHQUNwQyxNQUFNO0lBQ0wsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDdkIsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDZixPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUEsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQSxFQUFBO0dBQzFDO0NBQ0Y7O0FDMU5ELFNBQVMsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUU7SUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtNQUN4QixJQUFJLEdBQUcsRUFBRSxDQUFBO01BQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxJQUFJLElBQUk7UUFDM0MsaUNBQWlDO1FBQ2pDLEVBQUU7T0FDSCxDQUFBO01BQ0QsUUFBUTtLQUNUOzs7SUFHREEsSUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM5QkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUNuQixPQUFPLENBQUMsRUFBRSxFQUFFO1FBQ1IsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUNyQjs7SUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDcEMsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7Q0FDbkI7O0FBRUQsU0FBUyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtJQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUMzQixZQUFZLEVBQUUsSUFBSTtZQUNsQixVQUFVLEVBQUUsSUFBSTtZQUNoQixHQUFHLEVBQUUsU0FBUyxXQUFXLEdBQUc7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFDdkI7WUFDRCxHQUFHLEVBQUUsU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUMzQixFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTthQUN0QjtTQUNKLENBQUMsQ0FBQTtLQUNMO0NBQ0o7O0FBRUQsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDcEIsUUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0lBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDOztJQUVoQixJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7UUFDeEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakQsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQyxDQUFBO0NBQ0osQUFBQzs7QUFFRixFQUFFLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxBQUVyQixBQUFrQjs7OzsifQ==
