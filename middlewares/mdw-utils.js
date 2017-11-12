
module.exports = {

    requireBodyParams: function(req, res, params) {
        var p = req.body;        
        const undef = params.filter( (e) => typeof(p[e]) === 'undefined' );
        if ( undef.length ) {
                res.status(400).send({ok: false, msg: 'Body parameters ' + undef.join(',') + ' required.'})
                return false;
        }
        return true;
    },

    validateToken: function(req, res, decoded) {

        if (decoded.exp <= Date.now()) {
            res.status(400);
            res.json({
              "status": 400,
              "msg": "Token Expired"
            });
            return false;
          }
    
          // Authorize the user to see if s/he can access our resources
          
          const ipAddr = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
          if (decoded.ipAddr !== ipAddr) {
            res.status(400);
            res.json({
              "status": 400,
              "msg": "Invalid Ip address"
            });
            return false;
          }
          
        return true;
    }

};