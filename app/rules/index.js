const tarot = require('./tarot');

const rules = {
    'tarot': tarot
}

// callback(err, result)
function applyRule(game, req, callback) {
    if(!rules[game.type]) {
        console.log('rule not implmented')
        return callback('rule not implemented');
    }
    rules[game.type].processParameters(req, game, (err, result) => {
        return callback(err, result);
    });
}

module.exports = {
    applyRule
}