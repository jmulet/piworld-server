import * as winston from 'winston';
import { db } from '../mysql/db';
import { app } from '../server';
import { Router, Request, Response } from 'express';
import { remover } from '../misc/remover';

// Returns a list of the schools
const centerList = async function (req: Request, res: Response) {
    const sql = 'SELECT * FROM schools ORDER BY schoolName';
    const centers = await db.query(sql);
    res.send(centers.results);
};

// Updates center
const centerUpdate = async function (req: Request, res: Response) {
    const p = req.body;
    let sql = '';
    const obj: any = {
        schoolName: p.schoolName, professorName: p.professorName, professorEmail: p.professorEmail, language: p.language,
        enrollPassword: p.enrollPassword, canEnroll: p.canEnroll || 0, canPublish: p.canPublish || 0
    };
    if (p.id) {
        sql = 'UPDATE schools SET ? WHERE id=?';
        obj.id = p.id;
    } else {
        sql = 'INSERT INTO schools SET ?';
    }

    const centers = await db.query(sql, obj);
    let ok;
    if (p.id) {
        ok = centers.results.affectedRows > 0;
    } else {
        p.id = centers.results.insertId;
        ok = p.id > 0;
    }
    res.send({ ok: true, id: p.id });
};

// Deletes a center
const centerDelete = function (req: Request, res: Response) {
    const p = req.params;

    remover.delSchool(p.id).then( (data) => {
        res.send({ ok: data.affectedRows > 0 });
    }). catch( (data) => {
        res.send({ ok: false });
    });
};

export const centersRouter = Router();
centersRouter.get('/list', centerList);
centersRouter.post('/update', centerUpdate);
centersRouter.delete('/delete/:id', centerDelete);
