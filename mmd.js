//	Micro Module Definition (MMD)
//	A tiny module definition and dependency management framework.
//	(c) 2012 Greg MacWilliam, Threespot.
//	Freely distributed under the MIT license.
var mmd = (function(config, modules, api) {
	modules = {};

	var LEADING_CHARACTERS = /^\.+\//;

	var idStack = isArray(config) ? config : [];

	// Fetch the next ID in the series for use with anonymous definitions
	function nextId() {
		return idStack.shift();
	}

	// Remove leading dots and slashes from
	// module names
	// @param string id
	// @returns string
	function formatId(id) {
		return id.replace(LEADING_CHARACTERS, '');
	}
	
    // Whether argument is an array
    // @param {*}
    // @returns boolean
	function isArray(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	}
    
	// Find the position of an 'exports' string in an array
    // @param Array arr
    // @return number -1 if not found
	function findExports(arr) {
		if ( Array.prototype.indexOf) {
			return arr.indexOf('exports');
		}
		for( var i= 0, l=arr.length; i<l; i++) {
			if (arr[i] === 'exports') {
				return i;
			}
		}
		return -1;
	}

	var api = {
		// Defines a new module.
		// @param string-id
		// @param array-dependencies?
		// @param function-factory
		define: function(id, dependencies, factory) {
			if (typeof id !== 'string') {
				factory = dependencies;
				dependencies = id;
				id = null;
			}
			if ( ! isArray(dependencies)) {
				factory = dependencies;
				dependencies = [];
			}
			
			if (!id) {
				id = nextId();
			}
			
			// Error if a name or factory were not provided.
			if (!id || !factory) throw('invalid definition');
			
			id = formatId(id);

			// Set new module definition.
			modules[ id ] = {
				d: isArray(dependencies) ? dependencies : [],
				f: factory
			};
			
			//remove 'exports' item and add to module data
			if (isArray(dependencies)) {
				var exportsIndex = findExports(dependencies);
				if (exportsIndex !== -1) {
					modules[ id ].d.splice(exportsIndex, 1);
					modules[ id ].exp = exportsIndex;
				}
			}
		},

		// Add a new ID for use with anonymous defines
		// @param string Module ID
		pushId: function(id) {
			idStack.push(id);
		},

		// Return ids remaining in the stack
		getIds: function() {
			return idStack;
		},

		//Clear the module name stack
		clearIds: function() {
			idStack = [];
		},

		// Undefine a module
		// @param string module id
		undef : function(id) {
			delete modules[id];
		},
		
		// Requires a module. This fetches the module and all of its dependencies.
		// @param string|array-moduleId
		// @param function-callback
		require: function( req, callback ) {
			var single = !(isArray(req)),
				self = this,
				nil = null,
				id,
				mod,
				i;
		
			// Wrap a single dependency definition in an array.
			if (single) req = [ req ];
		
			for ( i = 0; i < req.length; i++ ) {
				id = formatId(req[i]);
				
				if (id === 'mmd') {
					// MMD framework reference:
					// Populate with self.
					req[ i ] = api;
					
				} else if (Object.prototype.hasOwnProperty.call( modules, id )) {
					// Known module reference:
					// Pull module definition from key table.
					mod = modules[ id ];

					// If the module has no existing export,
					// Resolve dependencies and create module.
					if ( !mod.e ) {
						// If module is active within the working dependency path chain,
						// throw a circular reference error.
						if (mod.p) throw('circular reference to ' + id);

						// Flag module as active within the path chain.
						mod.p = 1;

						// Run factory function with recursive require call to fetch dependencies.
						var dependencies = self.require(mod.d);
						var exportData = null;
						                        
						if (mod.exp !== undefined) {
							exportData = {};
							dependencies.splice(mod.exp, 0, exportData);
						}
						var fnReturn = mod.f.apply(nil, dependencies);
						mod.e = exportData ? exportData : fnReturn;

						// Release module from the active path.
						mod.p = 0;
					}

					// Replace dependency reference with the resolved module.
					req[ i ] = mod.e;
					
				} else {
					
					// Error for undefined module references.
					throw(id + ' is undefined');
				}
			}
	
			// If a callback function was provided,
			// Inject dependency array into the callback.
			if (callback && callback.apply) callback.apply(nil, req);
		
			// If directly referenced by ID, return module.
			// otherwise, return array of all required modules.
			return single ? req[0] : req;
		}
	};
	
	//Enable AMD style loading
	api.define.amd = {};

	return api;
}(window.mmd));