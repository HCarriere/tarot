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
        charts.push(cumulatedPointsBarChart(games, 4));
        charts.push(cumulatedPointsBarChart(games, 5));
        
        // chart Bubble: nombre de victoire en fonction du nombre de prise
        charts.push(priseByWinBubbleChart(games));
        
        return callback({
            stats: stats,
            charts: charts,
        });
    });
}

function cumulatedPointsBarChart(games, playersNumber) {
    let statsProcess = {};
    let persons = [];
    let stats = [];
    
    for(let game of games) {
        if(game.playersNumber == playersNumber) {
            for(let player of game.players) {
                if(!player.fake && player.score) {
                    if(!statsProcess[player.name]) {
                        statsProcess[player.name] = 0;
                    }
                    statsProcess[player.name]+=player.score;
                }
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
            legend: false,
            plugins: {
                drawLabels: false,
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            },
            title: {
                display: true,
                text: 'Total des points cumulés ('+playersNumber+')'
            }
        },
        heightRatio:1.5,
    };
}


function priseByWinBubbleChart(games) {
    let players = {};
    let data = [];
    for(let game of games) {
        for(let round of game.rounds) {
            for(let score of round.playersScores) {
                if(game.players.every(player => {
                    return !(player.fake && score.player == player.name);
                })) {
                
                    if(!players[score.player]) {
                        players[score.player] = {takes:0, win:0, score:0, rounds:1};
                    }
                    // win?
                    if(score.mod > 0) {
                        players[score.player].win += 1;
                    }
                    // take?
                    if(round.params && round.params.player == score.player) {
                        players[score.player].takes += 1;
                    }
                    // score?
                    players[score.player].score += score.mod;
                    // total
                    players[score.player].rounds += 1;
                }
            }
        }
    }
    // to array
    for(let key in players) {
        data.push({
            x: players[key].takes*100/players[key].rounds,
            y: players[key].win*100/players[key].rounds,
            v: players[key].score, 
            label: key,
        });
    }
    return {
        type: 'bubble',
        data:{
            datasets: [
                // {x, y, v}
                {data: data}
            ]
        },
        options: {
            aspectRatio: 1,
			legend: false,
			tooltips: false,
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero:true,
                        //max: 100,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '% prises'
                    },
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true,
                        //max: 100,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '% victoires'
                    },
                }],
            },
            title: {
                display: true,
                text: 'Prises / victoires'
            }
        },
    }
}

module.exports = {
    getGroupStats
}