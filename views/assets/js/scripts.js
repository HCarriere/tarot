$(document).ready(()=>{
    addEffects();
});

function addEffects() {
    
    // hideable sections
    $('.hideable-section').click(function(e) {
        $(this).children('.content').slideToggle({
            queue: false
        });
        $(this).toggleClass('hidden');
    });
}