(function(){
    

    $(document).ready(function(){

        // initialize all modals
        $('.modal').modal();

        // triggers
        $('.trigger-modal').modal();

        // collapsibles
        $('.collapsible').collapsible({
            accordion: false,
        });

        // chips
        $('.chips').chips();
        $('.new-player-selector').chips({
            placeholder: 'Entrer un nom',
            secondaryPlaceholder: '+Nom',
            onChipAdd: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*^*|'));
            },
            onChipDelete: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*^*|'));
            }
        });
        
        initScoreRange();
    
    });
    
    function initScoreRange() {
        
        function onScoreRangeUpdate(value, max) {
            $('#score_attk').text(value);
            $('#score_def').text(max - value);
        }
        
        let range = $('#score_range');
        
        range.on('input change', function(e){
            onScoreRangeUpdate(e.target.value, e.target.max)
        });
        
        $('#score_attk_add').on('click', function() {
            range.val(parseInt(range.val())+1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
        
        $('#score_def_add').on('click', function() {
            range.val(parseInt(range.val())-1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
    }
    
    
    
})();

