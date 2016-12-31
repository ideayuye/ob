
# Summary
ob是一个用于对象监听的轻量库。是从vue里面拆分出来的。由于感受到vue对对象监听的便利。想到对象监听，或许不止可以用来dom更新。还可以用于其它需要监控的场景。所以就尝试拆分出一个轻量的对象监听库。大小只有5.5k，gzip后3k。

[![Build Status](https://travis-ci.org/ideayuye/ob.svg?branch=master)](https://travis-ci.org/ideayuye/ob)
[![Coverage Status](https://coveralls.io/repos/github/ideayuye/ob/badge.svg?branch=master)](https://coveralls.io/github/ideayuye/ob?branch=master)

# Usage
监听对象：

    var data = {
        t: 'bilaaa',
        ruby: {
            type: 'dinamic'
        }
    };

    var ob = new Ob(data);

    ob.watch('ruby.type', function(value,oldvalue){
        console.log(data.ruby.type);
        console.log(this.ruby.type);
        console.log(value,oldvalue);
    });
    ob.ruby.type = 'static';


    //通过getter监听 watch的时候就执行getter函数 
    ob.watch(function(){
        var t = data.t;
    });
    ob.t = "xfa";

    //深度监听
    ob.watch('ruby.type', function(value,oldvalue){
        console.log(this.ruby.type);
    },{deep:true});
    data.ruby.type = {
        name:'binaf'
    };
    data.ruby.type.name = "cafx";    


监听数组(不能直接监听数组，必须把数组包装在对象的一个属性上)：

    var arrayData = {
        grass: [],
        vegetable: []
    };

    var obArray = new Ob(arrayData);

    obArray.watch('vegetable', function(){
        console.log(obArray.vegetable);
    });
    arrayData.vegetable.push('radish');
    obArray.$set(arrayData.vegetable,0,'pumpkin');//arrayData.vegetable[0]='xaa';不触发更新事件
    arrayData.vegetable.pop();


# API

- watch  添加监听函数

    para:
     {string|function} getter - 要监听的属性 可以通过函数获取
     {function} cb - 当数据变更 执行的回调函数
     {object} options - 配置项 deep-深度监听

     return:
        解绑监听事件函数

- $set 设置某个属性并促发更新事件,为弥补array[1]='xx'不触发更新事件而设计

    para:

     {object} obj - 要设置属性的对象 
     {string} key - 属性名称 
     {object} val - 属性值 
    
    return:
        属性值
    
    example:

        var setData = {
            animal:['human'],
            car:'bmw',
            jobs:{}
        }
        var obSet = new Ob(setData);

        obSet.$set(setData.jobs,'compony','tyb');
        obSet.$set(setData.animal, 0,'lion');

- $del 删除某个属性并促发更新事件

    para:

     {object} obj - 要删除属性的对象 
     {string} key - 属性名称 

    return:
        undefined
    
    example:

         obSet.$del(setData.jobs,'compony');
