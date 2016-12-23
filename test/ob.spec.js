
var process = {
    env: {
        NODE_ENV: 'dev'
    }
}


import {Ob} from '../src/main.js';

var data = {
    t: 'bilaaa',
    ruby: {
        type: 'dinamic'
    }
};
var ob = new Ob(data);

describe('watch object', () => {
    it('data', (done) => {
        var count = 0;
        var t = data.t;
        ob.watch(() => {
            count++;
            var t = data.t;
            if (count == 2) {
                expect(data.t).toEqual("xfa");
                done();
            }
        });

        data.t = "xfa";
    });

    it('teardown watcher', () => {
        var teardown = ob.watch(() => {});
        expect(ob._watchers.length).toEqual(2);
        teardown();
        expect(ob._watchers.length).toEqual(1);
    });

    it('watch attribute', (done) => {
        ob.watch('ruby.type', () => {
            expect(data.ruby.type).toEqual('static');
            done();
        });
        data.ruby.type = 'static';
    })
});


var arrayData = {
    grass: [],
    vegetable: []
};
var obArray = new Ob(arrayData);

describe('watch array in object', () => {
    it('array in object', (done) => {
        var count = 0;
        obArray.watch(() => {
            count++;
            var t = arrayData.grass;
            if (count == 2) {
                expect(arrayData.grass.length).toEqual(1);
                expect(arrayData.grass[0]).toEqual('xfa');
                done();
            }
        });
        arrayData.grass.push("xfa");
    });

    it('watch array attribute', (done) => {
        obArray.watch('vegetable', () => {
            expect(obArray.vegetable.length).toEqual(1);
            expect(obArray.vegetable[0]).toEqual('radish');
            done();
        });
        arrayData.vegetable.push('radish');
    });
});

describe('observe array false', () => {
    it("can't observe pure array", () => {
        var arrayData1 = ['lichens'];
        var obArray1 = new Ob(arrayData1);
        expect(obArray1.isInited).toEqual(false);
    });
});