//	Micro Module Definition (MMD)
//	A tiny module definition and dependency management framework.
//	(c) 2012 Greg MacWilliam, Threespot.
//	Freely distributed under the MIT license.
var mmd = (function(config, modules, api) {
	modules = {};

	var LEADING_CHARACTERS = /^\.+\//;

	var namespaces = isArray(config) ? config : [];

	// Fetch the next namespace in the series for use with anonymous definitions
	function nextId() {
		return namespaces.shift();
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
	
	function loadModule(mod) {
		// Position of magic 'exports' dependency
		var exportsIndex = -1;
		
		if (typeof mod.f !== 'function') {
			mod.e = mod.f;
		} else {
			exportsIndex = findExports(mod.d);
			if (exportsIndex !== -1) {
				// Remove 'exports' dependency before requiring
				mod.d.splice(exportsIndex, 1);
				
				// Module can be resolved to new export hash,
				mod.e = {};
				
				// Disable circular dependency check
				mod.p = 0;
			}
			
			// Run factory function with recursive require call to fetch dependencies.
			var dependencies = api.require(mod.d);
			
			// Re-add exports to dependencies array before passing to module factory
			if (exportsIndex !== -1) {
				dependencies.splice(exportsIndex, 0, mod.e);
			}
			
			var fnReturn = mod.f.apply(null, dependencies);
			mod.e = mod.e ? mod.e : fnReturn;
		}
		// Release module from the active path.
		mod.p = 0;
		
		return mod;
	}

	api = {
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
			
			// Error if module name is not provided
			if (!id) {
				throw('undefined namespace');
			}
			
			// Error if factory is not defined
			if (!factory) throw('invalid definition');
			
			id = formatId(id);

			// Set new module definition.
			modules[ id ] = {
				d: isArray(dependencies) ? dependencies : [],
				f: factory
			};
		},
		
		namespace: {
			add: function(namespace) {
				namespaces.push(namespace);
				
				return this;
			},
			clear : function() {
				namespaces = [];
				
				return this;
			},
			list: function() {
				return namespaces;
			}
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
						
						mod = loadModule(mod);
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
			if (callback && callback.apply) callback.apply(null, req);
		
			// If directly referenced by ID, return module.
			// otherwise, return array of all required modules.
			return single ? req[0] : req;
		}
	};
	
	//Enable AMD style loading
	api.define.amd = {};

	return api;
}(window.mmd));