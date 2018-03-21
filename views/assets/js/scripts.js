$(document).ready(()=>{
    addEffects();
});

function addEffects() {
    
    // hideable sections
    $('.hideable-section .title').click((e) => {
        $(this).siblings('.content').slideToggle({
            queue: false
        });
        $(this).parent('.hideable-section').toggleClass('hidden');
    });
    
    // new game
    $('#newGame').click((e) => {
        let gameName = window.prompt('Nom de la partie');
        self.location.href = '/game/new/'+gameName;
    });
}