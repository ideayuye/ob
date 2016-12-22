
import {observe,Observer} from './index.js'
import Watcher from './watcher.js'
import {isReserved} from './util.js'

function initData(vm, data) {
    vm._data = data;
    /*if (!isPlainObject(data)) {
      data = {}
      process.env.NODE_ENV !== 'production' && warn(
        'data functions should return an object.',
        vm
      )
    }*/

    // proxy data on instance
    const keys = Object.keys(data)
    let i = keys.length
    while (i--) {
        proxy(vm, keys[i])
    }
    // observe data
    observe(data)
    data.__ob__ && data.__ob__.vmCount++
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

class Ob{

    constructor(obj){
        this._watchers = [];
        initData(this,obj);
    }

    watch(getter,cb){
        var wat = new Watcher(this,getter,cb);
        return wat.teardown.bind(wat);
    }

}

window.Ob = Ob;
