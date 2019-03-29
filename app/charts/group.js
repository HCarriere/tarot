const Game = require('../game');
const utils = require('../utils');
const Group = require('../group');

function getChart(groupName, name, callback) {
    if(charts[name]) {
        // chart exists
        Group.find(groupName, (err, group) => {
            charts[name].func(groupName, charts[name].args, (data) => {
                callback(data);
            }, group);
        });
    } else {
        return callback({message: 'empty'})
    }
}

let charts = {
    allTimePointsTarot4 : {
        func : cumulatedPointsBarChart,
        args : {players: 4}
    },
    allTimePointsTarot5 : {
        func : cumulatedPointsBarChart,
        args : {players: 5}
    },
    seasonPointsTarot4 : {
        func : cumulatedPointsBarChart,
        args : {players: 4, season: true}
    },
    seasonPointsTarot5 : {
        func : cumulatedPointsBarChart,
        args : {players: 5, season: true}
    },
    previousSeasonPointsTarot4 : {
        func : cumulatedPointsBarChart,
        args : {players: 4, season: true, previous: true}
    },
    previousSeasonPointsTarot5 : {
        func : cumulatedPointsBarChart,
        args : {players: 5, season: true, previous: true}
    },
    prisesVictoire4 : {
        func : priseByWinBubbleChart,
        args : {players: 4}
    },
    prisesVictoire5 : {
        func : priseByWinBubbleChart,
        args : {players: 5}
    },
    tarotTimesCalled: {
        func: tarotTimesCalled,
    }
};

function cumulatedPointsBarChart(groupName, args, callback, group) {
    
    let filter = {
        group: groupName,
        playersNumber: args.players,
        $or:[{disabled: false}, {disabled: undefined}],
    };
    if(args.season) {
        let startOfSeason;
        let endOfSeason;
        
        if(args.previous) {
            startOfSeason = new Date();
            startOfSeason.setDate(1);
            startOfSeason.setMonth(startOfSeason.getMonth()-1);
            startOfSeason.setHours(1);
            
            endOfSeason = new Date(startOfSeason);
            endOfSeason.setMonth(endOfSeason.getMonth()+1);
            endOfSeason.setDate(0);
            endOfSeason.setHours(23);
            
        } else {
            startOfSeason = utils.getStartOfMonth(new Date());
            endOfSeason = new Date();
        }
        // let startOfWeek = utils.getMonday(new Date());
        
        filter.date = {
            $gte: startOfSeason,
            $lte: endOfSeason,
        }
    }
    
    Game.find(filter, (err, games) => {
        
        let statsProcess = {};
        let persons = [];
        let stats = [];

        for(let game of games) {
            for(let player of game.players) {
                if(!player.fake && player.score) {
                    if(!statsProcess[player.name]) {
                        statsProcess[player.name] = 0;
                    }
                    statsProcess[player.name]+=player.score;
                }
            }
        }

        let sortable = [];
        for(let player in statsProcess) {
            sortable.push([player, statsProcess[player]]);
        }
        sortable.sort((a, b) => {
            return b[1] - a[1];
        });
        statsProcess = {};
        for(let s of sortable) {
            statsProcess[s[0]] = s[1];
        }
        
        // to arrays
        for(let key in statsProcess) {
            // exclude disabled players
            if(!utils.isPlayerExcluded(group,key)) {
                persons.push(key);
                let corruption = 0;
                let p = group.players.find(p => p.name == key);
                if(p.corruption && p.corruption > 0) {
                    corruption = p.corruption;
                }    
                stats.push(statsProcess[key] + corruption);
            }
        }

        callback({
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
                    drawValues: true,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }]
                },
                title: {
                    display: false,
                }
            },
            heightRatio:stats.length/8,
        });
        
    });
}

function priseByWinBubbleChart(groupName, args, callback, group) {
    
    let filter = {
        group: groupName,
        playersNumber: args.players,
        $or:[{disabled: false}, {disabled: undefined}],
    };
    
    Game.find(filter, (err, games) => {
    
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
            // exclude disabled players
            if(!utils.isPlayerExcluded(group,key)) {
                data.push({
                    x: players[key].takes*100/players[key].rounds,
                    y: players[key].win*100/players[key].rounds,
                    v: players[key].score, 
                    label: key,
                });
            }
        }
        callback({
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
                plugins: {
                    drawLabels: true,
                    drawValues: false,
                },
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
                }
            },
        });
    });
}

function tarotTimesCalled(groupName, args, callback, group) {
    let calledHashMap = {};
    let persons = [];
    let dataPercentCalled = [];
    let dataTotalCalled = [];
    
    Game.find({
        group: groupName,
        $or:[{disabled: false}, {disabled: undefined}],
    }, (err, games) => {
        for(let game of games) {
            for(let round of game.rounds) {
                for(let player of game.players) {
                    if(!player.fake) {
                        if(!calledHashMap[player.name]) {
                            calledHashMap[player.name] = {
                                played: 0,
                                called: 0,
                            };
                        }
                        calledHashMap[player.name].played+=1;
                    }
                }
                if(round.params.called && calledHashMap[round.params.called]) {
                    calledHashMap[round.params.called].called+=1;
                } 
            }
        }
        
        for(let key in calledHashMap) {
            // exclude disabled players
            if(!utils.isPlayerExcluded(group,key)) {
                persons.push(key);
                dataPercentCalled.push(Math.round(
                    (calledHashMap[key].called / calledHashMap[key].played)*100));
                dataTotalCalled.push(calledHashMap[key].called);
            }
        }
        
        callback({
            type: 'horizontalBar',
            data: {
                labels: persons,
                datasets: [
                    {
                        label:'% de fois appellé par parties',
                        backgroundColor: '#225588',
                        data: dataPercentCalled,
                        borderColor: '#225588',
				        borderWidth: 2
                    },
                    {
                        label:'Total des appels',
                        backgroundColor: '#FFC423',
                        data: dataTotalCalled,
                        borderColor: '#FFC423',
				        borderWidth: 2
                    }
                ],
            },
            options: {
                plugins: {
                    drawLabels: false,
                }
            },
            heightRatio: persons.length/4,
        });
    });
}

module.exports = {
    getChart,
}