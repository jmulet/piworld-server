const winston = require('winston'),
models = require('../mysql/pool.models'),
utils = require('../mysql/utils'),
Remover = require('../misc/remover'),
db = utils.db;    
    

module.exports = function (app) {

    // Returns a list of the schools
    const center_list = async function (req, res) {
        const sql = "SELECT * FROM schools ORDER BY schoolName";        
        const centers = await db.query(sql);
        res.send(centers.results);
    };

    // Updates center 
    const center_update = function (req, res) {
        const p = req.body;
        const sql = "";
        const obj = {
            schoolName: p.schoolName, professorName: p.professorName, professorEmail: p.professorEmail, language: p.language,
            enrollPassword: p.enrollPassword, canEnroll: p.canEnroll || 0, canPublish: p.canPublish || 0
        };
        if (p.id) {
            sql = "UPDATE schools SET ? WHERE id='" + p.id + "'";
        }
        else {
            sql = "INSERT INTO schools SET ?";
        }
 
        const centers = await db.query(sql, obj);
        let ok;
        if(p.id) {
            ok = centers.results.affectedRows > 0;
        } else {
            p.id = centers.results.insertId;
            ok = p.id > 0;            
        }
        res.send({ ok: true, id: id });
    };

    // Deletes a center
    const center_delete = function (req, res) {
        const p = req.body;

        const resolved = function (data) {
            res.send({ ok: data.affectedRows > 0 });
        };
        const rejected = function (data) {
            res.send({ ok: false });
        };
        Remover.del_school(db, p.id, resolved, rejected);
    };

    app.post('/api/v1/admin/center/list', center_list);
    app.post('/api/v1/admin/center/update', center_update);
    app.post('/api/v1/admin/center/delete', center_delete);

};