
// dependencies
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const passport = require('passport');
const bodyParser = require('body-parser');

const http = require('http');
const path = require('path');

// general conf
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

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

/*
* ROUTES
*/

app

.get('/', (req, res) => {
    res.render('login', {
        
    });
})

// 404

.get('*', (req, res) => {
    res.status(404);
    res.json({error:'not found'});
})

// error handler

.use((err, req, res, next) => {  
    console.log(err);
    res.status(500);
    res.json({error:err});
});

// launch server

server.listen(port, (err) => {
   if(err) {
       console.log(err);
   } else {
       console.log(`platform listening on port ${port}`);
   }
});


