


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
    poignee_def : "none" / "simple" / "double" / "triple"
    misere : ["HCE", "Joueur 1"]
    double_misere : ["HCE", "Joueur 1"]
    chelem : ["annonce","realise","defense_realise"]
    regret: "regrette"
    */
    let round = {
        params: {
            contrat : params.contrat || 'prise',
            player : params.player,
            called : params.called,
            bouts : params.bouts,
            score : params.score,
            petit_au_bout :params.petit_au_bout,
            poignee: params.poignee,
            poignee_def: params.poignee_def,
            chelem : params.chelem,
            misere : params.misere,
			double_misere : params.double_misere,
            regret: params.regret,
        },
        playersScores: [],
        won: false,
    };
    let newScoresByPlayer = {};
    let score = {
        table: parseInt(params.score),
        contrat: 0,
    }
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
        } else if(params.player == 'BPR') {
            journal.push('Attaque victorieuse, quelle chance ce commercial...');
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
    function getPoigneeScore(poignee) {
        if(poignee == 'simple') {
            return 20;
        } else if(poignee == 'double') {
            return 30;
        } else if(poignee == 'triple') {
            return 40;
        }
        return 0;
    }
    // poignée attaque
    score.poignee = 0;
    if(params.poignee) {
        let prime = getPoigneeScore(params.poignee);
        
        if(win) {
            score.poignee += prime;
            journal.push(`Poignée ${params.poignee} de l'attaquant (réalisé): +${score.poignee} pour l'attaque`);
        } else {
            score.poignee += -prime;
            journal.push(`Poignée ${params.poignee} de l'attaquant (non réalisé): ${score.poignee} pour l'attaque`);
        }
    }
    // poignée défense
    if(params.poignee_def) {
        let prime = getPoigneeScore(params.poignee_def);
        
        if(win) {
            score.poignee += prime;
            journal.push(`Poignée ${params.poignee} de la défense (réalisé): +${score.poignee} pour l'attaque`);
        } else {
            score.poignee += -prime;
            journal.push(`Poignée ${params.poignee} de la défense (non réalisé): ${score.poignee} pour l'attaque`);
        }
    }
    
    // petit au bout
    if(params.petit_au_bout) {
        // old rules
        if(params.petit_au_bout == 'attq' || params.petit_au_bout == 'petit_au_bout') {
            journal.push(`Petit au bout pour l'attaquant : 10*${multiplicator} = ${multiplicator*10}`);
            score.contrat += 10*multiplicator;
        } else if(params.petit_au_bout == 'def') {
            
            journal.push(`Petit au bout pour la défense : 10*${multiplicator} (multiplicateur) = ${multiplicator*10}`);
            score.contrat -= 10*multiplicator;
        }
    }
    
    
    // final points
    let scoreFinal = 0;
    let scorePrenneur = 0;
    let scoreCalled = 0;
    scoreFinal = score.contrat;
    journal.push(`Score : contrat (${score.contrat})`);
    if(score.poignee && score.poignee != 0) {
        scoreFinal += score.poignee;
        journal.push(`Score : + poignee (${score.poignee}) = ${scoreFinal}`);
    }
    
    
    if(game.playersNumber == 4) {
        scorePrenneur = Math.floor(scoreFinal * 3);
        journal.push(`Bilan prenneur : contrat X 3 = ${scorePrenneur}`);
        
    } else {
        if(params.player == params.called) {
            journal.push(`Le joueur s'est appelé tout seul`);
            scorePrenneur = scoreFinal * 4;
            journal.push(`Bilan prenneur : ${scoreFinal} X 4 = ${scorePrenneur}`);
            scoreCalled = 0;
        } else {
            scorePrenneur = Math.floor(scoreFinal * 2);
            journal.push(`Bilan prenneur : ${scoreFinal} X 2 = ${scorePrenneur}`);

            scoreCalled = Math.floor(scoreFinal * 3 * (1/3));
            journal.push(`Bilan appelé : ${scoreFinal}`);   
        }
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
    
    // miseres
    if(params.misere) {
		let pointsMisere = 10 * (game.players.length - 1);
		let misere = params.misere;
        if(!Array.isArray(misere)) {
			misere = [ misere ];
		}
		let double_misere = [];
		if(params.double_misere) {
			double_misere = params.double_misere;
			if(!Array.isArray(double_misere)) {
				double_misere = [ double_misere ];
			}
		}
		for(let misereux of misere) {
			let mult = 1;
			if(double_misere.indexOf(misereux) > -1) {
				mult = 2;
			}
			for(let p of game.players) {
				if(p.name == misereux) {
					newScoresByPlayer[p.name] += pointsMisere * mult;
				} else {
					newScoresByPlayer[p.name] -= 10 * mult;
				}
			}
			journal.push(`Misère pour ${misereux} : +${pointsMisere * mult} pour lui et -${10 * mult} pour les autres`);
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