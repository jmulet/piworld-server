const key = require('../server.config').AES_SECRET;
const api = {};

api.Alea = function (seed) {
    var me = this, mash = Mash();

    me.next = function () {
        var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
        me.s0 = me.s1;
        me.s1 = me.s2;
        return me.s2 = t - (me.c = t | 0);
    };

    // apily the seeding algorithm from Baagoe.
    me.c = 1;
    me.s0 = mash(' ');
    me.s1 = mash(' ');
    me.s2 = mash(' ');
    me.s0 -= mash(seed);
    if (me.s0 < 0) { me.s0 += 1; }
    me.s1 -= mash(seed);
    if (me.s1 < 0) { me.s1 += 1; }
    me.s2 -= mash(seed);
    if (me.s2 < 0) { me.s2 += 1; }
    mash = null;
};

function Mash() {
    var n = 0xefc8249d;

    var mash = function (data) {
        data = data.toString();
        for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    return mash;
}

var r0 = 32;
var r1 = 126;
var rr = r1 - r0;
var rr1 = rr - 1;

api.encrypt = function (str) {
    var alea = new api.Alea(key);
    var n = str.length;
    var byt = new Array(n);
    for (var i = 0; i < n; i++) {
        var c = str.charCodeAt(i);
        if (r0 <= c && c <= r1) {
            var offset = Math.floor(alea.next() * rr1);
            var nc = (c + offset - r0) % rr + r0;
            byt[i] = nc;
        } else {
            byt[i] = c;
        }
    }
    return String.fromCharCode.apply(String, byt);
};

api.decrypt = function (str) {
    var byt = new Array(n);
    var n = str.length;
    var alea = new api.Alea(key);
    for (var i = 0; i < n; i++) {
        var c = str.charCodeAt(i);
        if (r0 <= c && c <= r1) {
            var offset = Math.floor(alea.next() * rr1);
            var nc = (c - offset - r0 + rr) % rr + r0;
            byt[i] = nc;
        } else {
            byt[i] = c;
        }
    }
    return String.fromCharCode.apply(String, byt);
};


module.exports = api;

