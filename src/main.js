
import {observe,Observer,set,del} from './observe.js'
import Watcher from './watcher.js'
import {isReserved,isPlainObject,warn,hasOwn} from './util.js'

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

 class Ob{
    constructor(obj){
        this._watchers = [];
        initData(this,obj);
        this._isInited = !!this._data;
        this.$set = set;
        this.$del = del;
    }

    watch(getter,cb,options){
        var wat = new Watcher(this,getter,cb,options);
        return wat.teardown.bind(wat);
    }

};

window.Ob = Ob;


