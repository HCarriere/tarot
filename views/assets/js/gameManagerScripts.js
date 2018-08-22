'use strict';

let gameManager = (function() {
    
    function deleteGame(id) {
        if(!id) return;
        let stupidArray = [
            `Etes-vous sur de vouloir supprimer DEFINITIVEMENT cette partie vide?`,
            `Vous vous apprêtez à utiliser une fonctionnalité avancée du site. Acceptez-vous-en les conséquences?`,
            `Il est encore temps d'annuler cette action. Ceci est la dernière fenêtre de confirmation. Etes-vous VRAIMENT sur?`,
            `La dernière, promis. Cette fonctionnalité est en version bêta, nous vous déconseillons donc A TOUT PRIX de l'utiliser. C'est votre dernier mot?`,
            `Cette action risque de rendre le site ENTIEREMENT inutilisable, ainsi que d'entraîner des frais d'entretiens de serveur supplémentaire au modérateur du site. Vous êtes ok avec ça?`,
            `Cliquez sur OK si vous n'avez pas de conscience.`,
            `Cliquez sur OK si vous n'avez aucun respect pour le modérateur.`,
            `Félicitation, vous êtes une mauvaise personne ! Cliquez sur OK pour terminer l'introduction.`,
            `CHAPITRE II : Comment le modérateur a réussi a ne pas avoir à coder une fonctionnalité grâce au pouvoir du découragement.`,
            `Partie 1. Cliquez sur OK pour commencer.`,
            `Cliquez sur OK pour ne PAS commencer.`,
            `Vous venez de cliquer sur OK, vous acceptez donc de ne PAS commencer. Cliquez sur OK pour confirmer.`,
            `Vous venez d'accepter un ordre d'un script JavaScript. Cliquez sur OK si vous vous sentez mal.`,
            `Peut-être que supprimer la partie vous fera plaisir, vous qui vous sentez mal?`,
            `Très bien, suppression en cours...`,
            `3...`,
            `2...`,
            `1...`,
            `Suppression.`,
        ];
        for(let s of stupidArray) {
            if(!confirm(s)) {
                return;
            }
        }
       
        post('/game/delete', {
            id: id
        });
    }
    
    function toggleDisabledGame(id) {
        if(!id) return;
        post('/game/toggleDisabled', {
            id: id
        });
    }
    
    return {
        deleteGame,
        toggleDisabledGame,
    }
    
})();

// Post to the provided URL with the specified parameters (thanks, stackoverflow)
function post(path, parameters) {
    var form = $('<form></form>');

    form.attr('method', 'post');
    form.attr('action', path);

    $.each(parameters, function(key, value) {
        var field = $('<input></input>');

        field.attr('type', 'hidden');
        field.attr('name', key);
        field.attr('value', value);

        form.append(field);
    });

    // The form needs to be a part of the document in
    // order for us to be able to submit it.
    $(document.body).append(form);
    form.submit();
}