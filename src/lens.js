/**
 * Created by laiff on 15.08.14.
 *
 */
/*global module:false, require:false, define:false,*/
(function (root, factory) {
    'use strict';
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports, like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return (root.lens = factory());
        });
    } else {
        // Browser globals
        root.lens = factory();
    }
}(this, function () {
    'use strict';

    //генерация гетеров
    var get = function (prop) {
        return function (item) {
            return item[prop];
        };
    };

    //генерация сетеров изменяемых структур
    var setMutable = function (prop) {
        return function (value, item) {
            item[prop] = value;
            return item;
        }
    };
    //генерация сетеров для неизменяемых структур
    var setImmutable = function (prop) {
        return function (value, item) {
            var props = properties(item), //получаем список всех свойств объекта
                copy = props.reduce(function (lst, next) {
                    lst[next] = item[next];
                    return lst;
                }, {});
            copy[prop] = value; //меняем на новое значение
            return copy;
        };
    };

    //возвращает список свойств объекта obj
    var properties = function (obj) {
        var key, lst = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                lst.push(key);
            }
        }
        return lst;
    };

    var Lens = function (getter, setter) {
        //Если передан 1 параметр, то это название свойства
        if (arguments.length == 1) {
            var property = arguments[0];
            getter = get(property);
            setter = setImmutable(property);
        }

        return {
            modify: function (func, item) {
                return setter(func(getter(item)), item);
            },
            compose: function (lens) {
                return Lens(innerGetter, innerSetter);

                function innerGetter(item) {
                    return lens.get(getter(item));
                }

                function innerSetter(value, item) {
                    var innerValue = lens.set(value, getter(item));
                    return setter(innerValue, item);
                }
            },
            get: getter,
            set: setter
        };
    };

    var lens = function (cmd) {
        var lenses = cmd.split('.').map(asOne(Lens));

        return lenses.reduce(function (lst, next) {
            return lst.compose(next);
        });
    };

    //функция которая из переданной ей на вход функции делает такую,
    //которая игнорирует все переданные ей аргументы, кроме первого
    var asOne = function (func) {
        return function (x) {
            return func(x);
        };
    };

    return lens;
}));