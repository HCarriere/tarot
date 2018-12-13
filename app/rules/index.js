const utils = require('../utils');
// rules
const tarot = require('./tarot');

const rules = {
    'tarot': {
        logic: tarot,
        params: [
            'contrat',
            'player',
            'called',
            'bouts',
            'score',
            'petit_au_bout',
            'poignee',
            'poignee_def',
            'chelem',
            'misere',
            'double_misere',
            'regret',
        ]
    }
}

// callback(err, result)
function applyRule(game, req, callback) {
    if(!rules[game.type]) {
        console.log('rule not implemented')
        return callback('rule not implemented');
    }
    
    applyRuleWithParams(
        game, 
        utils.getRequestParams(req, rules[game.type].params),
        callback
    );
}

function applyRuleWithParams(game, params, callback) {
    if(!rules[game.type]) {
        console.log('rule not implemented')
        return callback('rule not implemented');
    }
    
    rules[game.type].logic.processParameters(
        params, 
        game, 
        (err, round) => {
        return callback(err, round);
    });
}


function updateGameRules() {
    const Game = require('../game');
    console.log('updating all rounds from all games with new rules...');
    
    Game.find({}, (err, games) => {
        for(let game of games) {
            let n = 0;
            for(let i = 0; i<game.rounds.length; i++) {
                applyRuleWithParams(game, game.rounds[i].params, (err, nRound) => {
                    
                    if(nRound) {
                        game.rounds[i] = nRound;
                        n++;
                    }
                        
                });
            }
            
            // count each player score
            game.players = Game.getScoresFromRounds(game.players, game.rounds);

            game.save((err, result) => {
                if(result) console.log(n+' rounds of game '+result.name+' updated')
            });    
        }
    });
}

module.exports = {
    applyRule,
    applyRuleWithParams,
    updateGameRules,
}