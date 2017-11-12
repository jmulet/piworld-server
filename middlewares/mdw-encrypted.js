const decrypt = require('./security').decrypt;

module.exports = function (req, res, next) {
    req.rawBody = req.body;   
    if (req.headers['content-type'] === 'text/plain;charset=UTF-8') {
        try {
            req.body = JSON.parse(decrypt(req.rawBody));
            next();
        } catch (Ex) {
            console.log(Ex);
            res.send({ ok: false, msg: "Invalid middleware" });        
        }
    } else {
        next();
    }
};