"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../mysql/db");
const express_1 = require("express");
const remover_1 = require("../misc/remover");
// Returns a list of the schools
const centerList = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = 'SELECT * FROM schools ORDER BY schoolName';
        const centers = yield db_1.db.query(sql);
        res.send(centers.results);
    });
};
// Updates center
const centerUpdate = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = req.body;
        let sql = '';
        const obj = {
            schoolName: p.schoolName, professorName: p.professorName, professorEmail: p.professorEmail, language: p.language,
            enrollPassword: p.enrollPassword, canEnroll: p.canEnroll || 0, canPublish: p.canPublish || 0
        };
        if (p.id) {
            sql = 'UPDATE schools SET ? WHERE id=?';
            obj.id = p.id;
        }
        else {
            sql = 'INSERT INTO schools SET ?';
        }
        const centers = yield db_1.db.query(sql, obj);
        let ok;
        if (p.id) {
            ok = centers.results.affectedRows > 0;
        }
        else {
            p.id = centers.results.insertId;
            ok = p.id > 0;
        }
        res.send({ ok: true, id: p.id });
    });
};
// Deletes a center
const centerDelete = function (req, res) {
    const p = req.params;
    remover_1.remover.delSchool(p.id).then((data) => {
        res.send({ ok: data.affectedRows > 0 });
    }).catch((data) => {
        res.send({ ok: false });
    });
};
exports.centersRouter = express_1.Router();
exports.centersRouter.get('/list', centerList);
exports.centersRouter.post('/update', centerUpdate);
exports.centersRouter.delete('/delete/:id', centerDelete);
//# sourceMappingURL=centers.router.js.map