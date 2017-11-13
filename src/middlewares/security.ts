
const seedKey = 'jl8jKsYDwB';

function Mash() {
    let n = 0xefc8249d;

    return (data: any) => {
        data = data.toString();
        for (let i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            let h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

}

export class Alea {
    c: number;
    s0: number;
    s1: number;
    s2: number;
    constructor(private seed: any) {
        const mash = Mash();
        // Apply the seeding algorithm from Baagoe.
        this.c = 1;
        this.s0 = mash(' ');
        this.s1 = mash(' ');
        this.s2 = mash(' ');
        this.s0 -= mash(seed);
        if (this.s0 < 0) { this.s0 += 1; }
        this.s1 -= mash(seed);
        if (this.s1 < 0) { this.s1 += 1; }
        this.s2 -= mash(seed);
        if (this.s2 < 0) { this.s2 += 1; }
    }

    next() {
        const t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10; // 2^-32
        this.s0 = this.s1;
        this.s1 = this.s2;
        return this.s2 = t - (this.c = t | 0);
    }
}

const r0 = 32;
const r1 = 126;
const rr = r1 - r0;
const rr1 = rr - 1;

export const encryptUtil = {

    guid(): string {
        return Math.random().toString(36).slice(2);
    },

    encrypt(inp: any): string {
        let str: string;
        if (typeof (inp) !== 'string') {
            str = JSON.stringify(inp);
        } else {
            str = inp || '';
        }

        const alea = new Alea(seedKey);
        const n = str.length;
        const byt = new Array(n);
        for (let i = 0; i < n; i++) {
            const c = str.charCodeAt(i);
            if (r0 <= c && c <= r1) {
                const offset = Math.floor(alea.next() * rr1);
                const nc = (c + offset - r0) % rr + r0;
                byt[i] = nc;
            } else {
                byt[i] = c;
            }
        }
        return String.fromCharCode.apply(String, byt);
    },

    decrypt(str: string): string {
        const n = str.length;
        const byt = new Array(n);
        const alea = new Alea(seedKey);
        for (let i = 0; i < n; i++) {
            const c = str.charCodeAt(i);
            if (r0 <= c && c <= r1) {
                const offset = Math.floor(alea.next() * rr1);
                const nc = (c - offset - r0 + rr) % rr + r0;
                byt[i] = nc;
            } else {
                byt[i] = c;
            }
        }
        return String.fromCharCode.apply(String, byt);
    }
};


