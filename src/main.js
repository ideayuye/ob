
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

/**
 * 数据监听类
 */
function Ob(obj) {
    this._watchers = [];
    initData(this, obj);
    this._isInited = !!this._data;
    this.$set = set;
    this.$del = del;

    /**
     * 添加监听函数
     * @param {string|function} getter - 要监听的属性 可以通过函数获取
     * @param {function} cb - 当数据变更 执行的回调函数
     * @param {object} options - 配置项 deep-深度监听
     * 
     * @returns {function} - 解绑监听事件函数
     */
    this.watch = function (getter, cb, options) {
        var wat = new Watcher(this, getter, cb, options);
        return wat.teardown.bind(wat);
    }
};

Ob.version = '1.0.1';

export default Ob;


