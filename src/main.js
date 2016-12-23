
import {observe,Observer} from './observe.js'
import Watcher from './watcher.js'
import {isReserved,isPlainObject,warn} from './util.js'

function initData(vm, data) {
    if (!isPlainObject(data)) {
      data = {}
      process.env.NODE_ENV !== 'production' && warn(
        'data should be an plain object.',
        vm
      )
      return ;
    }

    // proxy data on instance
    const keys = Object.keys(data)
    let i = keys.length
    while (i--) {
        proxy(vm, keys[i])
    }
    // observe data
    observe(data)
    data.__ob__ && data.__ob__.vmCount++
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
                vm._data[key] = val
            }
        })
    }
}

export class Ob{

    constructor(obj){
        this._watchers = [];
        initData(this,obj);
        this.isInited = !(!this._data || this._data !== obj);
    }

    watch(getter,cb){
        var wat = new Watcher(this,getter,cb);
        return wat.teardown.bind(wat);
    }

};

// window.Ob = Ob;

// export Ob;
