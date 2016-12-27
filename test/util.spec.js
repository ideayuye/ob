


import {_Set} from '../src/util.js';

describe('profill Set',()=>{
    it('type',()=>{
        expect(/native code/.test(_Set.toString())).toEqual(false);
    });

    var tSet = new _Set();

    it('add',()=>{
        tSet.add('bmw');
        expect(tSet.has('bmw')).toEqual(true);
        expect(tSet.has('other')).toEqual(false);
    });

    it('add',()=>{
        tSet.clear();
        expect(tSet.has('bmw')).toEqual(false);
    });
})
