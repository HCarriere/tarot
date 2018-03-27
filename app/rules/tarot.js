


function processParameters(params, game, callback) {
    /*
    console.log('contrat : '+JSON.stringify(params.contrat));
    console.log('player : '+JSON.stringify(params.player));
    console.log('called : '+JSON.stringify(params.called));
    console.log('bouts : '+JSON.stringify(params.bouts));
    console.log('score : '+JSON.stringify(params.score));
    console.log('petit_au_bout : '+JSON.stringify(params.petit_au_bout));
    console.log('poignee : '+JSON.stringify(params.poignee));
    console.log('chelem : '+JSON.stringify(params.chelem));
    console.log('misere : '+JSON.stringify(params.misere));
    
    /*
    contrat : "prise"
    player : "HCE"
    called : "Joueur 1"
    bouts : ["petit","21","excuse"]
    score : "67"
    petit_au_bout : "none" / "attq" / "def"
    poignee : "none" / "simple" / "double" / "triple"
    chelem : ["annonce","realise","defense_realise"]
    misere : ["HCE", "Joueur 1"]
    */
    let round = {
        params: {
            contrat : params.contrat || 'prise',
            player : params.player,
            called : params.called,
            bouts : params.bouts,
            score : params.score,
            petit_au_bout :params.petit_au_bout,
            poignee :params.poignee,
            chelem : params.chelem,
            misere : params.misere,
        },
        playersScores: [],
        won: false,
    };
    let newScoresByPlayer = {};
    let score = {
        table: parseInt(params.score),
        contrat: 0,
    }
    let misereux = {};
    let win = false;
    let journal = [];
    
    journal.push('Points attaquant(s) : '+score.table);
    
    // win ?
	let valContrat = 56;
    if(params.bouts) {
        if(Array.isArray(params.bouts)) {
            if(params.bouts.length == 1) {
                valContrat = 51;
            } else if(params.bouts.length == 2) {
                valContrat = 41;
            } else if(params.bouts.length == 3) {
                valContrat = 36;
            }
        } else {
            valContrat = 51;
        }
    }
    journal.push(`Points à faire : ${valContrat}`);
    journal.push(`Points déduits : ${score.table}-${valContrat} = ${score.table - valContrat}`);
    score.contrat = score.table - valContrat;
    win = score.contrat >= 0;
    
    if(win) {
        if(params.player == 'HCE') {
            journal.push('Le créateur est victorieux ! Vive le créateur !');
        } else {
            journal.push('Attaque victorieuse');
        }
        journal.push(`Contrat : ${score.contrat} + 25 = ${score.contrat+25}`);
        score.contrat += 25;
    } else {
        journal.push('Défense victorieuse');
        journal.push(`Contrat : ${score.contrat} - 25 = ${score.contrat-25}`);
        score.contrat -= 25;
    }
    
    round.won = win;
    
    
    
    // calcul pts
    let multiplicator = 1;
    // if(contrat == 'prise') multiplicator = 1;
    if(params.contrat == 'garde') multiplicator = 2;
    if(params.contrat == 'garde_sans') multiplicator = 4;
    if(params.contrat == 'garde_contre') multiplicator = 6;
    
    journal.push(`Contrat : ${round.params.contrat} (x${multiplicator})`);
    journal.push(`Score : ${score.contrat} * ${multiplicator} = ${score.contrat*multiplicator}`);
    score.contrat*= multiplicator;
    
    
    // chelems
    if(score.table >= 91){
        if(params.chelem && params.chelem.indexOf('annonce') != -1) {
            // annoncé, réalisé
            journal.push(`Chelem annoncé et réalisé : +400 à l'attaquant`);
            score.contrat += 400;
        } else {
            // non annoncé, réalisé
            journal.push(`Chelem non annoncé et réalisé : +200 à l'attaquant`);
            score.contrat += 200;
        }
    } else {
        if(params.chelem && params.chelem.indexOf('annonce') != -1) {
            // annoncé, non réalisé
            journal.push(`Chelem annoncé et non réalisé : -200 à l'attaquant`);
            score.contrat -= 200;
        }
    }
    if(score.table <= 0) {
        // defense réussit un chelem
        journal.push(`La défense réussit un chelem (GG) : +200 points à la défense`);
        score.contrat -= 200;
    }
    
    // poignées
    if(params.poignee) {
        let prime = 0;
        if(params.poignee == 'simple') {
            prime = 20;
        } else if(params.poignee == 'double') {
            prime = 30;
        } else if(params.poignee == 'triple') {
            prime = 40;
        }
        
        if(win) {
            score.poignee += prime;
            journal.push(`Poignée ${params.poignee} de l'attaquant (réalisé): +${prime} pour l'attaquant`);
        } else {
            score.poignee -= prime;
            journal.push(`Poignée ${params.poignee} de l'attaquant (non réalisé): +${prime} pour la défense`);
        }
    }
    
    // petit au bout
    if(params.petit_au_bout) {
        if(params.petit_au_bout == 'attq') {
            journal.push(`Petit au bout pour l'attaquant : 10*${multiplicator} = ${multiplicator*10}`);
            if(win) score.contrat += 10*multiplicator;
            else score.contrat -= 10*multiplicator;
        } else if(params.petit_au_bout == 'def') {
            journal.push(`Petit au bout pour la défense : 10*${multiplicator} = ${multiplicator*10}`);
            if(win) score.contrat -= 10*multiplicator;
            else score.contrat += 10*multiplicator;
        }
    }
    
    // miseres
    if(params.misere) {
        // TODO (pas supporté par la FFT)
    }
    
    
    // final points
    let scoreFinal = 0;
    let scorePrenneur = 0;
    let scoreCalled = 0;
    scoreFinal = score.contrat;
    journal.push(`Score : contrat (${score.contrat})`);
    if(win) {
        if(score.poignee) {
            scoreFinal += score.poignee;
            journal.push(`Score : + poignee (${score.poignee}) = ${scoreFinal}`);
        }
    }
    
    
    if(game.playersNumber == 4) {
        scorePrenneur = Math.floor(scoreFinal * 3);
        journal.push(`Bilan prenneur : contrat X 3 = ${scorePrenneur}`);
        
    } else {
        scorePrenneur = Math.floor(scoreFinal * 3 * (2/3));
        journal.push(`Bilan prenneur : contrat X 3 X (2/3) = ${scorePrenneur}`);
        
        scoreCalled = Math.floor(scoreFinal * 3 * (1/3));
        journal.push(`Bilan appelé : score prenneur(${scorePrenneur}) * (1/3) = ${scoreCalled}`);
        
    }
    
    let scoreDef = -scoreFinal;
    journal.push(`Bilan défense : -score final(${scoreFinal}) = ${scoreDef}`);
    
    round.journal = journal;
    
    // attribute score to players
    for(let p of game.players) {
        if(!newScoresByPlayer[p.name]) {
            newScoresByPlayer[p.name] = 0;
        }
        if(p.name == params.player) {
            // prenneur
            newScoresByPlayer[p.name] += scorePrenneur;
        } 
        if(p.name == params.called) {
            // appelé
            newScoresByPlayer[p.name] += scoreCalled;
        } 
        if(p.name != params.player && p.name != params.called) {
            // autres joueurs
            newScoresByPlayer[p.name] += scoreDef;
        }
    }
    
    
    // update player round score
    for(let p of game.players) {
        
        round.playersScores.push({
            player: p.name,
            mod: newScoresByPlayer[p.name],
        });
    }
    // update game
    /*for(let p of game.players) {
        if(!p.score) {
            p.score = 0;
        }
        
        p.score += newScoresByPlayer[p.name];
    }*/
    
    /*if(!game.rounds) {
        game.rounds = [];
    }
    game.rounds.push(round);*/
    
    
   /* game.save((err, res) => {
        if(err) return console.error(err);
        return callback(null, res);
    });*/
    return callback(null, round);
}


module.exports = {
    processParameters
}