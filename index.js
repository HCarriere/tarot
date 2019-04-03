
// dependencies
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const passport = require('passport');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');

const http = require('http');
const path = require('path');

// general conf
const app = express();
const port = process.env.PORT || 13002;
const server = http.createServer(app);
const sessionSecret = process.env.SESSION_SECRET || 's3cr3tS355i0nStr1ng';
const env = process.env.NODE_ENV || 'development';
const forceSsl = env === 'production';
const utils = require('./app/utils');

// handlebars conf

let handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        ifEquals: (arg1, arg2, options) => {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        ifGt: (arg1, arg2, options) => {
            return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
        },
        ifEmpty: (arg1, options) => {
            return (arg1.length == 0) ? options.fn(this) : options.inverse(this);
        },
        json: (ctx, options) => {
            return JSON.stringify(ctx, null, options);
        },
        add1: (ctx, options) => {
            return parseInt(ctx) + 1;
        },
        join: (list, str) => {
            return list.join(str);
        },
        joinName: (list, str) => {
            return list.map(item => item.name).join(str);
        },
    }
});

// general middlewares
let appForceSsl = (req, res, next) => {
    if(forceSsl) {      
        if(req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(['https://', req.get('Host'), req.url].join(''));
        }
    }
    return next();
};

app
.use(appForceSsl)

// express
.use(express.static(path.join(__dirname,'views/assets')))
.use(session({
    secret: sessionSecret,
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

let isAuth = utils.mustBeAuthentified(sessionSecret);
// models 
const Group = require('./app/group');
const Game = require('./app/game');
const chart = require('./app/charts');
const rules = require('./app/rules');
const hallOfFame = require('./app/charts/halloffame');

/*
* ROUTES
*/

app
.get('/', isAuth, (req, res) => {
    processStats(req);
    Group.getGroupWithGames(req.session.currentGroup, result => {
        res.render('group', {
            titleSuffix: ' - '+req.session.currentGroup,
            description: 'Outil de comptage de point au jeu de Tarot',
            group: result.group,
            games: result.games,
            overallStats: result.overallStats,
            additionalJS:[
                '/js/lib/Chart.min.js',
                '/js/statsCall.js'
            ]
        });
    }, req);
})

.get('/login', (req, res) => {
    res.render('login', {
        additionalJS: [
            '/js/loginScripts.js'
        ]
    });
})

.post('/login', (req, res) => {
    Group.logonToGroup(req, (err, group) => {
        if(group) {
            // ok
            utils.setConnected(req, sessionSecret, group.name);
            res.redirect('/');
        } else {
            // ko
            res.render('login', {
                error: err
            });  
        }
    });
})

.post('/group/add', (req, res) => {
    Group.addGroup(req, (err, group) => {
        if(group) {
            // ok
            utils.setConnected(req, sessionSecret,  group.name);
            res.redirect('/');
        } else {
            // ko
            res.render('login', {
                error: err,
            });     
        }
    });
})

.post('/group/selectplayers', isAuth, (req,res) => {
    Group.setActivePlayers(req, err => {
        if(err) console.log(err);
        res.redirect('/');
    });
})

.get('/new/game', isAuth, (req, res) => {
    Group.getGroup(req.session.currentGroup, (group) => {
        Game.getDefaultGameName((name) => {
            res.render('newGame', {
                defaultName : name,
                group: group,
            });
        });
    });
})

.post('/new/game', isAuth, (req, res) => {
    Game.addGame(req, (err, game) => {
        if(err) {
            res.render('newGame', {
                error: err
            });
        } else {
            res.redirect('/game/'+game._id);
        }
    });
})

.get('/game/:id', isAuth, (req, res) => {
    Game.getGame(
        req.params.id, 
        req.session.currentGroup, 
        (err, game) => {
        if(err) {
            res.render('group', {
                error: err
            });
        } else {
            res.render('game', {
                game: game,
                charts: [
                    chart.game.pointsParPersonnes(game.rounds),
                    chart.game.prisesParPersonnes(game.rounds),
                    chart.game.prisesParContrats(game.rounds),
                ],
                additionalJS: [
                    '/js/lib/Chart.min.js',
                    '/js/gameManagerScripts.js',
                ]
            });
        }
    });
})

.post('/round/add', isAuth, (req, res) => {
    Game.addRoundToGame(req, (err, game) => {
        if(err) console.log(err);
        processStats(req);
        res.redirect('/game/'+game._id);
    });
    
})

.post('/round/edit', isAuth, (req, res) => {
    Game.editRoundFromGame(req, (err, game) => {
        if(err) console.log(err);
        processStats(req);
        res.redirect('/game/'+game._id);
    });
})

.post('/game/delete', isAuth, (req, res) => {
    Game.deleteGame(req, err => {
        if(err) res.redirect('/?error='+err);
        else res.redirect('/');
    });
})

.post('/game/toggleDisabled', isAuth, (req, res) => {
    Game.toggleDisabled(req, (err, game) => {
        if(err) console.log(err);
        processStats(req);
        res.redirect('/game/'+game._id);
    })
})

.get('/player/:player', isAuth, (req, res) => {
    Group.getAllGamesForPlayer(req, (err, games, player) => {
        if(err) {
            console.log(err)
        }
        res.render('player', {
            player: player,
            charts: [
                chart.player.individualPointsEvolutionTarot5(games, player.name),
            ],
            heatmaps: [
                chart.player.gameScoreInYearHeatmapTarot5(games, player.name),
            ],
            additionalJS: [
                '/js/lib/Chart.min.js',
                '/js/lib/d3.min.js',
                '/js/lib/d3-tip.js',
                '/js/heatmap.js',
            ]
        });
    }, 5, false);
})

/*
.get('/stats/group', isAuth, (req, res) => {
    Group.getGroupStats(req.session.currentGroup, (stats) => {
        res.json(stats); 
    });
})*/

.get('/stats/chart/group/:chart', isAuth, (req, res) => {
    chart.group.getChart(req.session.currentGroup, 
                         req.params.chart, 
                         (data) => {
        res.json(data);
    });
})

// default : 5 players
.get('/api/group/:group/games', (req, res) => {
    Group.logonToGroup({body:{
        name:req.params.group,
        password:req.query.password,
    }}, (err, group) => {
        if(err) {
            res.status(400);
            res.json({error:err});
            return err;
        }
        Game.getGames({
            group: group.name,
            playersNumber: req.query.playersNumber || 5,
        }, games => {
            res.json(games);
        }, req.query.transform || false);
    })
})

.get('/ping', (req, res) => {
    res.json('ok');
})

.get('/%F0%9F%98%82', (req, res) => {
    res.render('hbd');
})

// Replay every rounds of every games with the actual game rules.
.get('/updateGameRules', isAuth, (req, res) => {
    rules.updateGameRules();
    res.json('command launched');
})

// 401
.get('/forbidden', (req, res) => {
    res.status(401);
    res.render('login', {
        error: 'non autorisé'
    }); 
})

// 404

.get('*', (req, res) => {
    res.status(404);
    res.render('notfound', {layout: false});
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

function processStats(req) {
    hallOfFame.processBadges(req.session.currentGroup, result => {
    });
}

