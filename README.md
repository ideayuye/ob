
# Summary
object observe from vue

# Usage
监听对象：

    var data = {
        t: 'bilaaa',
        ruby: {
            type: 'dinamic'
        }
    };

    var ob = new Ob(data);

    ob.watch('ruby.type', () => {
        console.log(data.ruby.type);
    });
    ob.ruby.type = 'static';


    //通过getter监听 watch的时候就执行getter函数
    ob.watch(() => {
        var t = data.t;
    });
    ob.t = "xfa";

监听数组：

    var arrayData = {
        grass: [],
        vegetable: []
    };

    var obArray = new Ob(arrayData);

    obArray.watch('vegetable', () => {
        console.log(obArray.vegetable);
    });
    arrayData.vegetable.push('radish');
    arrayData.vegetable.pop();

# API

- watch

- $set

- $del

