const moment = require('moment');

/**
 - evolution des points dans le temps
 - git graph (parties par jours)
 - apports par joueurs : qui apporte combien
*/

function individualPointsEvolutionTarot5(games, player){
    
    let pointsMap = {};
    let lastValue = 0;
    
    for(let game of games) {
        let dateKey = getTimeAggregation(game.date, game.name);
        for(let round of game.rounds) {
            for(let score of round.playersScores) {
                if(score.player == player) {
                    if(!pointsMap[dateKey]) {
                        pointsMap[dateKey] = lastValue;
                    }
                    pointsMap[dateKey] += score.mod;
                    lastValue = pointsMap[dateKey];
                }
            }
        }
    }
    
    let xAxisNames = [];
    let data = [];
    for(let key in pointsMap) {
        xAxisNames.push(key);
        data.push(pointsMap[key]);
    }
    
    return {
        type: 'line',
        data: {
            labels: xAxisNames,
            datasets: [
                {label:player, data: data}
            ],
        },
        options: {
            plugins: {
                drawLabels: false,
                drawValues: false,
            },
        },
        label: 'Points (Tarot à 5)',
   };
}

/**
* allow the aggregation of time values or gameName, by:
* - week or
* - gameName or
* - 
*/
function getTimeAggregation(date, gameName){
    // return moment(date).format('[S]W[-]YYYY'); // week
    return `${gameName} (${moment(date).format('MM[-]YYYY')})`; // gameName
}

module.exports = {
    individualPointsEvolutionTarot5,
}