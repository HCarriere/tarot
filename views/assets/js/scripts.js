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
        
        initEditModal();
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
            range.val(parseInt(range.val())-1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
        
        $('#score_def_add').on('click', function() {
            range.val(parseInt(range.val())+1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
    }
    
    function initEditModal() {
        let elem = document.querySelector('.game-params-modal');
        let instance = M.Modal.init(elem);
        
        function resetGameParamsModal() {
            // checkbox
            $('.game-params-modal input[type="radio"], .game-params-modal input[type="checkbox"]').prop('checked', false);
            
            // button
            $('#modal-default-button').show();
            $('#modal-edit-button').hide();
            
            // round id
            $('input[name="existingRoundId"]').val('');
        }
        
        function setCheckboxesInput(selector, name, value) {
            let inputs = $(selector+' input[name="'+name+'"]');
            inputs.filter('[value="'+value+'"]').prop('checked', true);
        }
        
        
        $('.button-reset-game-params').on('click', function() {
            // reset modal
            resetGameParamsModal();
            // open modal
            instance.open();
        });
        
        
        $('.button-edit-game-params').on('click', function(e) {
            // reset modal
            resetGameParamsModal();
            
            // edit modal with current data
            let data = JSON.parse($(this).attr('current-data'));
            let id = $(this).attr('edit-id');
            
            for(let d in data) {
                if(Array.isArray(data[d])) {
                    for(let v of data[d]) {
                        setCheckboxesInput('.game-params-modal', d, v);
                    }
                } else {
                    setCheckboxesInput('.game-params-modal', d, data[d]);
                    if($('.game-params-modal input[name="'+d+'"]').attr('type') == 'range') {
                        $('.game-params-modal input[name="'+d+'"]').val(data[d]);
                    }
                }
            }
            $('#score_range').trigger('change');
            
            // change button
            $('#modal-default-button').hide();
            $('#modal-edit-button').show();
            
            // set current round id
            $('input[name="existingRoundId"]').val(id);
            
            // open modal
            instance.open();
        });
    }
    
})();

