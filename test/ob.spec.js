

var data = {
    t:'bilaaa',
    ruby:{
        type:'dinamic'
    }
};
var ob = new Ob(data);

describe('watch data',()=>{
    it('data',(done)=>{
        var count = 0;
        ob.watch(()=>{
            count ++;
            var t = data.t;
            if (count == 2) {
                expect(data.t).toEqual("xfa");
                done();
            }
        });

        data.t = "xfa";
    });

    it('teardown watcher',()=>{
        var teardown = ob.watch(()=>{
        });
        expect(ob._watchers.length).toEqual(2);
        teardown();
        expect(ob._watchers.length).toEqual(1);
    });

    it('watch attribute',(done)=>{
        ob.watch('ruby.type',()=>{
            expect(data.ruby.type).toEqual('static');
            done();
        });
        data.ruby.type = 'static';
    })
});

