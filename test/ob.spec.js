

describe('watch object', () => {
    var data = {
        t: 'bilaaa',
        ruby: {
            type: 'dinamic'
        }
    };
    Object.defineProperty(data,'formatTime',{
        enumerable:true,
        configurable:true,
        get:function(){
            return this.formatTimeValue;
        },
        set:function(val){
            this.formatTimeValue = val + 'set';
        }
    });
    var ob = new Ob(data);
    it('common data', (done) => {
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

        ob.t = "xfa";
    });

    it('teardown watcher', () => {
        var teardown = ob.watch(() => {});
        expect(ob._watchers.length).toEqual(2);
        teardown();
        expect(ob._watchers.length).toEqual(1);
    });

    it('watch attribute', (done) => {
        var teardown = ob.watch('ruby.type', (value,oldvalue) => {
            expect(data.ruby.type).toEqual('static');
            expect(value).toEqual('static');
            expect(oldvalue).toEqual('dinamic');
            teardown();
            done();
        });
        ob.ruby.type = 'static';
    })

    it('watch custom setter attr',(done)=>{
        var teardown = ob.watch('formatTime', function() {
            expect(data.formatTime).toEqual('timeset');
            expect(this.formatTime).toEqual('timeset');
            teardown();
            done();
        });
        data.formatTime = 'time'
    })

    it('watch not defined attr',(done)=>{
        var count =0;
        var teardown = ob.watch('ladon',()=>{
            count ++;
        })
        data.ladon = 'die';
        setTimeout(()=>{
            expect(count).toEqual(0);
            teardown();
            done();
        },100);
    })

    it('wtach wrong attr',(done)=>{
        var count =0;
        var teardown = ob.watch('*fnifa',()=>{
            count++;
        })
        data['*fnifa'] = 'die';
        setTimeout(()=>{
            expect(count).toEqual(0);
            teardown();
            delete data['*fnifa'];
            done();
        },100);
    })

});


describe('watch array in object', () => {
    var arrayData = {
        grass: [],
        vegetable: []
    };
    var obArray = new Ob(arrayData);
    it('watch array getter', (done) => {
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

    it('watch array push', (done) => {
        var teardown = obArray.watch('vegetable', () => {
            expect(obArray.vegetable.length).toEqual(1);
            expect(obArray.vegetable[0]).toEqual('radish');
            teardown();
            done();
        });
        arrayData.vegetable.push('radish');
    });

    it('watch pop',(done)=>{
        var teardown = obArray.watch('vegetable',()=>{
            expect(obArray.vegetable.length).toEqual(0);
            teardown();
            done();
        });
        arrayData.vegetable.pop();
    });

    it('watch splice',(done)=>{
        arrayData.vegetable.push('cabbage');
        arrayData.vegetable.push('pumpkin');
        var teardown = obArray.watch('vegetable',()=>{
            expect(obArray.vegetable.length).toEqual(1);
            expect(obArray.vegetable[0]).toEqual('pumpkin');
            teardown();
            done();
        });
        arrayData.vegetable.splice(0,1);
    });

    it('watch unshift',(done)=>{
        var teardown = obArray.watch('vegetable',()=>{
            expect(obArray.vegetable.length).toEqual(2);
            expect(obArray.vegetable[0]).toEqual('cabbage');
            teardown();
            done();
        });
        arrayData.vegetable.unshift('cabbage');
    });

});

describe('set attribute', () => {
    var setData = {
         animal:['human'],
         car:'bmw',
         jobs:{}
    }
    var obSet = new Ob(setData);
    it('set root attr failure', () => {
        obSet.$set(setData,'address','beiqijia');
        expect(obSet.address).toEqual(undefined);
    });

    it('del root attr failure',()=>{
        expect(setData.car).toEqual('bmw');
        obSet.$del(setData,'car');
        expect(setData.car).toEqual('bmw');
    });

    it('set exist attr',(done)=>{
        var teardown = obSet.watch('car',()=>{
            expect(setData.car).toEqual('bz');
            done();
        });
        obSet.$set(setData,'car','bz');
    });

    it('set attr',(done)=>{
        var teardown = obSet.watch('jobs',()=>{
            expect(setData.jobs.compony).toEqual('tyb');
            teardown();
            done();
        });
        obSet.$set(setData.jobs,'compony','tyb');
    });

    it('del attr',(done)=>{
        var teardown = obSet.watch('jobs',()=>{
            expect(setData.jobs.compony).toEqual(undefined);
            teardown();
            done();
        });
        obSet.$del(setData.jobs,'compony');
        obSet.$del(setData.jobs,'none');
    });

    it('set array attr',(done)=>{
        obSet.watch('animal',()=>{
            expect(setData.animal[0]).toEqual('lion');
            done();
        });
        obSet.$set(setData.animal, 0,'lion');
    });

});

describe('watch deep',()=>{
    var deepData = {
            film:"1980年带爱情",
            songs:{
                singer:'sun yanzi'
            },
            phone:{
                brand:[{
                    name:'apple'
                }]
            }
        }
    var obDeep = new Ob(deepData);

    it('deep data',(done)=>{
        obDeep.watch('songs',()=>{
            expect(deepData.songs.singer).toEqual('tyb2');
            done();
        },{deep:true});
        deepData.songs.singer = "tyb2";
    });

    it('deep array',()=>{
        var count = 0;
        obDeep.watch('film',()=>{
            count ++ ;
            if(count == 1){
                expect(deepData.film.length).toEqual(1);
                expect(deepData.film[0].star).toEqual('9.8');
            }
            if(count == 2){
                expect(deepData.film[0].star).toEqual('9.9');
                done();
            }
        });
        deepData.film = [{name:'1980年代爱情',star:'9.8'}];
        deepData.film[0].star = '9.9';
    });

    it('deep array 1',()=>{
        obDeep.watch('phone',()=>{
            expect(deepData.phone.brand[0].name).toEqual('mi');
        },{deep:true})
        deepData.phone.brand[0].name = "mi";
    });

});

describe('observe pure array failure ', () => {
    var pureArray = ['lichens'];
    var obPureArray = new Ob(pureArray);

    it("init observe pure array failure", () => {
        expect(obPureArray._isInited).toEqual(false);
    });
});


