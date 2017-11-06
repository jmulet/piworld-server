var extend = require('util')._extend;

var platform = process.platform;

var config = {
    USER_ROLES: {
        admin: 0,
        teacher: 100,
        teacherNonEditing: 105,
        teacheradmin: 110,
        student: 200,
        guest: 300,
        undefined: 400,
        parents: 500
    },
    AES_SECRET: "",         //Secret for encryption (optional)
    LANGS: ['ca', 'es', 'en'],
    hostname: 'localhost:3000',
    adminUser: 'root',
    adminPassword: '',      //Set a password for admin user
    adminLang: 'ca',
    adminEmail: '',         //Set an email for site admin
    adminEmailPass: '',     //Set a password for email admin
    mathpix: { },           //Configure mathpix account (optional)
    API_KEY: "",            //Set google apps api key
    oauth2: {               //Configure oauth2 for google app
        accessToken: "",
        refreshToken: "", 
        token_type: "", 
        expires: 0,
        clientId: "", 
        project_id: "",
        auth_uri: "", 
        token_uri: "",
        auth_provider_x509_cert_url: "",
        clientSecret: "", 
        redirect_uris: ["", ""]
    },
    badges: {
        CMT: { id: 1, desc: "Comment bagde", score: 10, EVERY: 4 },
        REG: { id: 2, desc: "Regularity bagde", score: 100, EVERY: 3 },
        BOW: { id: 3, desc: "Best of weeek bagde", score: 200, MIN: 100 },
        BOM: { id: 4, desc: "Best of month bagde", score: 300, MIN: 500 },
        CHL: { id: 5, desc: "Weekly challenge badge", score: 140 }
    }

};

var platform_config = {};

if (platform.indexOf('win') === 0) {
    console.log("Node platform windows");

    platform_config = {
        //Configure the database connection here
        mysql: {
            host: 'localhost',
            port: 3306,
            user: '',               //Set mysql user
            password: '',           //Set mysql password
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: 'c:\\Maxima-5.31.2\\bin\\maxima.bat',
            python: 'c:\\Python33\\python.exe',
            yacas: '',
            pandoc: 'c:\\Pandoc\\pandoc.exe',
            tmp: 'c:\\imaths-tmp\\',
            mysqldump: ''
        },

        express: {
            port: 3000
        },

        logLevel: 'debug'

    };
} else if (platform === 'darwin') {
    console.log("Node platform darwin");
  
    platform_config = {
        //Configure the database connection here
        mysql: {
            host: 'localhost',
            port: 3306,
            user: '',               //Set mysql user
            password: '',           //Set mysql password
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: '/Applications/Maxima.app/Contents/Resources/maxima.sh',
            python: '/usr/bin/python',
            pandoc: '/usr/local/bin/pandoc',
            tex: '/usr/local/texlive/2014basic/bin/universal-darwin/',
            yacas: '/usr/bin/yacas',
            tmp: '/Users/josep/imaths-tmp/',
            mysqldump: '/usr/local/mysql/bin/mysqldump'
        },

        express: {
            port: 3200
        },
        logLevel: 'debug'
    };
}
else if (platform === 'linux') {
    console.log("Node platform linux");
    config.hostname = '46.101.208.135';

    platform_config = {

        mysql: {
            host: 'localhost',
            port: 3306,
            user: '',               //Set mysql user
            password: '',           //Set mysql password
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: '/usr/bin/maxima',
            python: '/usr/bin/python',
            yacas: '/usr/bin/yacas',
            tex: '',
            pandoc: '/usr/local/bin/pandoc',
            tmp: '/root/imaths-tmp/',
            mysqldump: '/usr/bin/mysqldump'
        },

        express: {
            port: 3000
        },

        logLevel: 'warn'
    };
}
else {
    console.log("Please provide a configuration for platform ", platform);
    process.exit(1);
}
platform_config.platform = platform;

// Choose here your preferred configuration
module.exports = extend(config, platform_config);

