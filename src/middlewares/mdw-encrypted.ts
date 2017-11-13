import { encryptUtil } from './security';
import { Response, NextFunction } from 'express';
import { JwtRequest } from './mdw-utils';

export function mdwEncrypted(req: JwtRequest, res: Response, next: NextFunction) {
    req.rawBody = req.body;
    if (req.headers['content-type'] === 'text/plain;charset=UTF-8') {
        try {
            req.body = JSON.parse(encryptUtil.decrypt(req.rawBody));
            next();
        } catch (ex) {
            console.log(ex);
            res.send({ ok: false, msg: 'Invalid middleware' });
        }
    } else {
        next();
    }
}
