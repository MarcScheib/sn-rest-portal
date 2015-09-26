'use strict';

var config = require('./config');
var http = require('http');
var express = require('express');
var errorHandler = require('errorhandler');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');

module.exports = function() {
    var app = express();
    var server = http.createServer(app);

    if (process.env.NODE_ENV === 'development') {
        app.use(errorHandler({dumpExceptions: true, showStack: true}));
        app.use(morgan('dev'));
    } else if (process.env.NODE_ENV === 'production') {
        app.use(errorHandler());
        app.use(compress());
    }

    console.log('Running in ' + process.env.NODE_ENV + '...');

    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());

    // session support
    app.use(cookieParser());
    app.use(session({
        resave: true,
        rolling: true,
        saveUninitialized: true,
        secret: config.sessionSecret
    }));

    app.set('views', './src/server/templates');

    // Load controllers and routes
    require('../src/server/lib/routing/BootstrapRest')(app, {
        verbose: config.verbose
    });

    // Configure partial requests
    app.get('/partial/:controller/:action', function (req, res) {
        res.render(req.params.controller + '/' + req.params.action);
    });

    // Serving static files
    app.use('/static', express.static('./src/public/assets'));
    app.use('/jspm_packages', express.static('./jspm_packages'));

    // Serve layout
    app.use(function(req, res) {
        res.render('layout/layout');
    });

    // URI not found
    app.use(function (err, req, res) {
        res.status(500).render('error/5xx');
    });

    // assume 404 since no middleware responded
    app.use(function (req, res) {
        res.status(404).render('error/404', {
            url: req.originalUrl
        });
    });

    return server;
};