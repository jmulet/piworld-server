const _platform = process.platform;

const _config = {
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
    AES_SECRET: '',
    jwt_secret: '',
    LANGS: ['ca', 'es', 'en'],
    hostname: 'localhost:3000',
    adminUser: 'root',
    adminPassword: '',
    adminLang: 'en',
    adminEmail: '',
    adminEmailPass: '',
    mathpix: { },
    API_KEY: '',
    oauth2: {
        accessToken:
        '',
        refreshToken: '',
        token_type: 'Bearer',
        expires: 0,
        clientId: '', 'project_id': '',
        auth_uri: '', 'token_uri': '',
        auth_provider_x509_cert_url: '',
        clientSecret: '',
        redirect_uris: ['', '']
    },
    badges: {
        CMT: { id: 1, desc: 'Comment bagde', score: 10, EVERY: 4 },
        REG: { id: 2, desc: 'Regularity bagde', score: 100, EVERY: 3 },
        BOW: { id: 3, desc: 'Best of weeek bagde', score: 200, MIN: 100 },
        BOM: { id: 4, desc: 'Best of month bagde', score: 300, MIN: 500 },
        CHL: { id: 5, desc: 'Weekly challenge badge', score: 140 }
    }

};

let platformConfig: any;

if (_platform.indexOf('win') === 0) {
    console.log('Node platform windows');

    platformConfig = {
        //Configure the database connection here
        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
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

        logLevel: 'verbose'

    };
} else if (_platform === 'darwin') {
    console.log('Node platform darwin');

    platformConfig = {
        //Configure the database connection here
        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
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
} else if (_platform === 'linux') {
    console.log('Node platform linux');
    _config.hostname = '46.101.208.135';

    platformConfig = {

        mysql: {
            host: 'localhost',
            port: 3306,
            user: '',
            password: '',
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
} else {
    console.log('Please provide a configuration for platform ', _platform);
    process.exit(1);
}

// Choose here your preferred configuration
export const config: any = {..._config, ...platformConfig, platform: _platform};
module.exports = config;

