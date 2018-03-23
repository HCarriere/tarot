/*$(document).ready(()=>{
    addEffects();
});

function addEffects() {
    
    // hideable sections
    // TODO https://stackoverflow.com/questions/38213329/how-to-add-css3-transition-with-html5-details-summary-tag-reveal
    $('.hideable-section .title').click(function(e) {
        $(this).siblings('.content').slideToggle({
            queue: false
        });
        $(this).parent('.hideable-section').toggleClass('hidden');
    });
    
}*/

(function ($) {
    $(function () {

        // initialize all modals
        $('.modal').modal();

        // triggers
        $('.trigger-modal').modal();
        
        // collapsibles
        $('.collapsible').collapsible();
        
        // chips
        $('.chips').chips();
        $('.new-player-selector').chips({
            placeholder: 'Entrer un nom',
            secondaryPlaceholder: '+Nom',
            onChipAdd: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*|*|'));
            },
            onChipDelete: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*|*|'));
            }
        });
        
    }); // end of document ready
})(jQuery); // end of jQuery name space