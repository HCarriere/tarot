$(document).ready(()=>{
    addEffects();
});

function addEffects() {
    
    // hideable sections
    $('.hideable-section .title').click(function(e) {
        $(this).siblings('.content').slideToggle({
            queue: false
        });
        $(this).parent('.hideable-section').toggleClass('hidden');
    });
}