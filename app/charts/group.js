const Game = require('../game');

function getGroupStats(groupName, callback) {
    let stats = {};
    let charts = [];
    
    Game.find({
        group: groupName
    }, (err, games) => {
        if(err) {
            return callback({err: 'erreur de type erreur.'});
        }
        if(games.length==0) {
            return callback({err: 'pas de stats'});
        }
        
        // nombre de tours moyen
        let tourMoyen = 0;
        for(let game of games) {
            tourMoyen += game.rounds.length;
        }
        tourMoyen=tourMoyen/games.length;
        stats.averageRoundsPerGame=tourMoyen;
        
        // maximum / minimum de points en un tour
        let maxPts = {value: -9999};
        let minPts = {value: 9999};
        for(let game of games) {
            for(let round of game.rounds) {
                for(let score of round.playersScores) {
                    if(score.mod > maxPts.value) {
                        // max
                        maxPts = {
                            value: score.mod,
                            from: game.name,
                            by: score.player,
                            id: game.id,
                        };
                    }
                    if(score.mod < minPts.value) {
                        // min
                        minPts = {
                            value: score.mod,
                            from: game.name,
                            by: score.player,
                            id: game.id,
                        };
                    }
                }
            }
        }
        stats.maximumPointsInOneRound=maxPts;
        stats.minimumPointsInOneRound=minPts;
        
        // total des points cumulés / joueur (bar, ordered)
        charts.push(cumulatedPoints(games));
        
        return callback({
            stats: stats,
            charts: charts,
        });
    });
}

function cumulatedPoints(games) {
    let statsProcess = {};
    let persons = [];
    let stats = [];
    
    for(let game of games) {
        for(let player of game.players) {
            if(/*!player.fake && */player.score) {
                if(!statsProcess[player.name]) {
                    statsProcess[player.name] = 0;
                }
                statsProcess[player.name]+=player.score;
            }
        }
    }
    
    // to arrays
    for(let key in statsProcess) {
        persons.push(key);
        stats.push(statsProcess[key]);
    }
    
    return {
        type: 'horizontalBar',
        data: {
            labels: persons,
            datasets: [{
                data: stats,
                label: 'Points cumulés'
            }],
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        },
        label: 'Points cumulés',
        heightRatio:1.5,
    };
}


module.exports = {
    getGroupStats
}