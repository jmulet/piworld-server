const jwt = require('jwt-simple'),
config = require('../server.config'),
auth = require('../users/auth-cache'),
validateToken = require('./mdw-utils').validateToken;
 
const usersCache = {};

module.exports = function(req, res, next) {

  // When performing a cross domain request, you will recieve
  // a preflighted request first. This is to check if our the app
  // is safe. 

  // We skip the token outh for [OPTIONS] requests.
  //if(req.method == 'OPTIONS') next();

  const token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
   
  if (token) {

    try {
     
      const decoded = jwt.decode(token, config.jwt_secret);
      if ( !validateToken(req, res, decoded) ) {
          return;
      }
      // Add token information to req
      req.jwt = decoded;
         
      const role = decoded.idRole;
      const admin = config.USER_ROLES.admin;
      const teacherAdmin = config.USER_ROLES.teacherAdmin;
      
        if ((req.url.indexOf('admin') >= 0 && (role === admin || role === teacherAdmin) ) || (req.url.indexOf('admin') < 0 && req.url.indexOf('/api/v1/') >= 0)) {
            next(); // To move to next middleware
        } else {
          res.status(403);
          res.json({
            "status": 403,
            "message": "Not Authorized"
          });
          return;
        }
       
    } catch (err) {
      console.log(err);
      res.status(500);
      res.json({
        "status": 500,
        "message": "Oops something went wrong",
        "error": err
      });
    }
  } else {
    res.status(401);
    res.json({
      "status": 401,
      "message": "Invalid Token or Key"
    });
    return;
  }
};