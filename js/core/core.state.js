
/**
 * State information for a table
 *
 * @param {*} settings
 * @returns State object
 */
function _fnSaveState ( settings )
{
	if (settings._bLoadingState) {
		return;
	}

	/* Store the interesting variables */
	var state = {
		time:    +new Date(),
		start:   settings._iDisplayStart,
		length:  settings._iDisplayLength,
		order:   $.extend( true, [], settings.aaSorting ),
		search:  $.extend({}, settings.oPreviousSearch),
		columns: settings.aoColumns.map( function ( col, i ) {
			return {
				visible: col.bVisible,
				search: $.extend({}, settings.aoPreSearchCols[i])
			};
		} )
	};

	settings.oSavedState = state;
	_fnCallbackFire( settings, "aoStateSaveParams", 'stateSaveParams', [settings, state] );
	
	if ( settings.oFeatures.bStateSave && !settings.bDestroying )
	{
		settings.fnStateSaveCallback.call( settings.oInstance, settings, state );
	}	
}


/**
 * Attempt to load a saved table state
 *  @param {object} oSettings dataTables settings object
 *  @param {object} oInit DataTables init object so we can override settings
 *  @param {function} callback Callback to execute when the state has been loaded
 *  @memberof DataTable#oApi
 */
function _fnLoadState ( settings, init, callback )
{
	if ( ! settings.oFeatures.bStateSave ) {
		callback();
		return;
	}

	var loaded = function(state) {
		_fnImplementState(settings, state, callback);
	}

	var state = settings.fnStateLoadCallback.call( settings.oInstance, settings, loaded );

	if ( state !== undefined ) {
		_fnImplementState( settings, state, callback );
	}
	// otherwise, wait for the loaded callback to be executed

	return true;
}

function _fnImplementState ( settings, s, callback) {
	var i, ien;
	var columns = settings.aoColumns;
	settings._bLoadingState = true;

	// When StateRestore was introduced the state could now be implemented at any time
	// Not just initialisation. To do this an api instance is required in some places
	var api = settings._bInitComplete ? new DataTable.Api(settings) : null;

	if ( ! s || ! s.time ) {
		settings._bLoadingState = false;
		callback();
		return;
	}

	// Reject old data
	var duration = settings.iStateDuration;
	if ( duration > 0 && s.time < +new Date() - (duration*1000) ) {
		settings._bLoadingState = false;
		callback();
		return;
	}

	// Allow custom and plug-in manipulation functions to alter the saved data set and
	// cancelling of loading by returning false
	var abStateLoad = _fnCallbackFire( settings, 'aoStateLoadParams', 'stateLoadParams', [settings, s] );
	if ( abStateLoad.indexOf(false) !== -1 ) {
		settings._bLoadingState = false;
		callback();
		return;
	}

	// Number of columns have changed - all bets are off, no restore of settings
	if ( s.columns && columns.length !== s.columns.length ) {
		settings._bLoadingState = false;
		callback();
		return;
	}

	// Store the saved state so it might be accessed at any time
	settings.oLoadedState = $.extend( true, {}, s );

	// This is needed for ColReorder, which has to happen first to allow all
	// the stored indexes to be usable. It is not publicly documented.
	_fnCallbackFire( settings, null, 'stateLoadInit', [settings, s], true );

	// Page Length
	if ( s.length !== undefined ) {
		// If already initialised just set the value directly so that the select element is also updated
		if (api) {
			api.page.len(s.length)
		}
		else {
			settings._iDisplayLength   = s.length;
		}
	}

	// Restore key features
	if ( s.start !== undefined ) {
		if(api === null) {
			settings._iDisplayStart    = s.start;
			settings.iInitDisplayStart = s.start;
		}
		else {
			_fnPageChange(settings, s.start/settings._iDisplayLength);
		}
	}

	// Order
	if ( s.order !== undefined ) {
		settings.aaSorting = [];
		$.each( s.order, function ( i, col ) {
			settings.aaSorting.push( col[0] >= columns.length ?
				[ 0, col[1] ] :
				col
			);
		} );
	}

	// Search
	if ( s.search !== undefined ) {
		$.extend( settings.oPreviousSearch, s.search );
	}

	// Columns
	if ( s.columns ) {
		for ( i=0, ien=s.columns.length ; i<ien ; i++ ) {
			var col = s.columns[i];

			// Visibility
			if ( col.visible !== undefined ) {
				// If the api is defined, the table has been initialised so we need to use it rather than internal settings
				if (api) {
					// Don't redraw the columns on every iteration of this loop, we will do this at the end instead
					api.column(i).visible(col.visible, false);
				}
				else {
					columns[i].bVisible = col.visible;
				}
			}

			// Search
			if ( col.search !== undefined ) {
				$.extend( settings.aoPreSearchCols[i], col.search );
			}
		}
		
		// If the api is defined then we need to adjust the columns once the visibility has been changed
		if (api) {
			api.columns.adjust();
		}
	}

	settings._bLoadingState = false;
	_fnCallbackFire( settings, 'aoStateLoaded', 'stateLoaded', [settings, s] );
	callback();
}
