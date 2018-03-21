
// dependencies
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const passport = require('passport');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const http = require('http');
const path = require('path');

// general conf
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const utils = require('./app/utils');

// handlebars conf

let handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
});

// general middlewares

app
.use(express.static(path.join(__dirname,'views/assets')))
.use(session({
    secret: process.env.SESSION_SECRET || 'secretSessionString',
    resave: false,
    saveUninitialized: false,
}))

// authentification
.use(passport.initialize())
.use(passport.session())

// to support JSON-encoded bodies
.use(bodyParser.json()) 

// to support URL-encoded bodies
.use(bodyParser.urlencoded({
  extended: true
})) 

// handlebars
.engine('.hbs', handlebars.engine)
.set('view engine', '.hbs')
.set('views', path.join(__dirname, 'views/layouts'));

// mongoose
mongoose.connect(process.env.DB_URI || 'mongodb://localhost/tarot');

mongoose.connection.on('error', (err) => {
    console.log('mongoose default connection error: '+err);
});

mongoose.connection.on('connected', () => {
    console.log('mongoose connected');
});

mongoose.connection.on('disconnected', () => {
    console.log('mongoose disconnected');
});

process.on('SIGINT', function() {  
    mongoose.connection.close(function () { 
        console.log('Mongoose default connection disconnected through app termination'); 
        process.exit(0); 
    }); 
}); 

// models 
const Group = require('./app/group');

/*
* ROUTES
*/

app
.get('/', utils.mustBeAuthentified() ,(req, res) => {
    res.render('group', {
        titleSuffix: ' - '+req.session.currentGroup,
        group: req.session.currentGroup,
    });
})

.get('/login', (req, res) => {
    res.render('login', {
        
    });
})

.post('/login', (req, res) => {
    Group.logonToGroup(req, (group) => {
        if(group) {
            // ok
            utils.setConnected(req, group.name);
            res.redirect('/');
        } else {
            // ko
            res.render('login', {
                error: 'wrong password'
            });  
        }
    });
})

.post('/group/add', (req, res) => {
    Group.addGroup(req, (err, group) => {
        if(group) {
            // ok
            utils.setConnected(req, group.name);
            res.redirect('/');
        } else {
            // ko
            res.render('login', {
                error: err,
            });     
        }
    });
})
// 404

.get('*', (req, res) => {
    res.status(404);
    res.json({error:'not found'});
})

// error handler

.use((err, req, res, next) => {  
    console.log('server error : '+err);
    res.status(500);
    res.json({error:err});
});

// launch server

server.listen(port, (err) => {
   if(err) {
       console.log('server launch error : '+err);
   } else {
       console.log(`platform listening on port ${port}`);
   }
});



