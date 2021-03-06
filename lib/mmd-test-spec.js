/**
* Jasmine test suite for MMD framework.
*/
describe("Micro Module Definition (MMD)", function() {

	// 1) Define
	it("should define a module with an id, factory function, and optional dependencies array.", function() {
		
		// Okay: includes id, dependencies, and factory.
		expect(function() {
			
			mmd.define('define1', [], function() {});
		
		}).not.toThrow();
		
		// Okay: includes id and factory, omits dependencies.
		expect(function() {
			
			mmd.define('define2', function() {});
			
		}).not.toThrow();
	});
	
	// 2) Define
	it("should throw exception for invalid definitions without an id and/or factory function.", function() {
		// Missing factory...
		expect(function() {
			
			mmd.define('malformed');
			
		}).toThrow();
		
		// Missing id...
		expect(function() {
			
			mmd.define(function() {});
			
		}).toThrow();
		
		// Missing both...
		expect(function() {
			
			mmd.define([]);
			
		}).toThrow();
		
		
		try {
			mmd.define();
		} catch (e) {
			console.log(e);
		}
	});
	
	// 3) Simple Require
	it("should require a single module by id string; corresponding module is returned, and injected into optional callback.", function() {
		
		var content = "module content",
			returned;
		
		// Define a simple module which returns the "content" value.
		mmd.define('test3', function() {
			return content;
		});
		
		// Require module by id...
		
		// a) Return
		// Module's content should be returned, and optional callback ignored.
		returned = mmd.require('test3');
		expect( returned ).toBe( content );
		
		// b) Inject
		// Module's content should be injected into a provided callback.
		mmd.require( 'test3', function( injected ) {
			expect( injected ).toBe( content );
		});
		
		// c) Return & Inject
		// Module's content should be both returned and injected into provided callback.
		returned = mmd.require( 'test3', function( injected ) {
			expect( injected ).toBe( content );
		});
		expect( returned ).toBe( content );
	});
	
	it("should define modules without factory functions", function() {
		var content = {staticData: 'data'},
			returned;
		
		expect(function() {
			
			mmd.define('static1', content);
			
		}).not.toThrow();
		
		returned = mmd.require('static1');
		expect( returned).toBe( content );
	});
	
	it("should allow removal of defined modules.", function() {
		mmd.define('remove1', [], function() {});
		expect(function() {
			
			mmd.require('remove1');
			
		}).not.toThrow();
		
		mmd.undef('remove1');
		
		expect(function() {
			
			mmd.require('remove1');
			
		}).toThrow();
	});
	
	// 4) MMD framework self-fulfillment references.
	it('should fulfill "mmd" dependencies with MMD framework reference.', function() {

		// Require MMD...
		
		// a) Return
		// Module's content should be returned, and optional callback ignored.
		var returned = mmd.require('mmd');
		expect( returned ).toBe( mmd );
		
		// b) Inject
		// Module's content should be injected into a provided callback.
		mmd.require( 'mmd', function( injected ) {
			expect( injected ).toBe( mmd );
		});
		
		// c) Return & Inject
		// Module's content should be both returned and injected into provided callback.
		returned = mmd.require( 'mmd', function( injected ) {
			expect( injected ).toBe( mmd );
		});
		expect( returned ).toBe( mmd );
	});
	
	// 5) Requiring undefined modules.
	it("should throw exception when requiring undefined modules.", function() {
		
		// Define a simple module.
		mmd.define('defined-module', function() {});
		
		// Expect that one undefined module will throw an error.
		expect(function() {
			
			mmd.require( 'undefined-module' );
			
		}).toThrow();
		
		// Expect that ANY undefined module will throw an error.
		expect(function() {
			
			mmd.require(['defined-module', 'undefined-module']);
			
		}).toThrow();
		
		
		try {
			mmd.require( 'undefined-module' );
		} catch (e) {
			console.log(e);
		}
	});
	
	// 6) Multi-Require
	it("should require multiple modules as an array of ids; corresponding modules array is returned, and injected into optional callback.", function() {
		
		var module1 = "mod1",
			module2 = "mod2",
			returned;
		
		// Define a simple module which returns the "content" value.
		mmd.define('multi.1', function() {
			return module1;
		});
		mmd.define('multi.2', function() {
			return module2;
		});
		
		returned = mmd.require(['multi.1', 'multi.2'], function( mod1, mod2 ) {
			expect( mod1 ).toBe( module1 );
			expect( mod2 ).toBe( module2 );
		});
		
		expect( returned.length ).toBe( 2 );
		expect( returned[0] ).toBe( module1 );
		expect( returned[1] ).toBe( module2 );
	});
	
	// 7) Require with dependencies
	it("should resolve all module dependencies; modules should only build once when first required.", function() {
		
		var module1 = "mod1",
			module2 = "mod2",
			module3 = "mod3",
			module4 = "mod4",
			calls1 = 0,
			calls2 = 0,
			calls3 = 0,
			calls4 = 0,
			returned;
		
		// Define a simple module which returns the "content" value.
		mmd.define('tree.1', function() {
			calls1++;
			return module1;
		});
		mmd.define('tree.2', ['tree.1'], function( mod1 ) {
			expect( mod1 ).toBe( module1 );
			calls2++;
			return module2;
		});
		mmd.define('tree.3', ['tree.1'], function( mod1 ) {
			expect( mod1 ).toBe( module1 );
			calls3++;
			return module3;
		});
		mmd.define('tree.4', ['tree.2', 'tree.3'], function( mod2, mod3 ) {
			expect( mod2 ).toBe( module2 );
			expect( mod3 ).toBe( module3 );
			calls4++;
			return module4;
		});
		
		returned = mmd.require('tree.4', function( injected ) {
			expect( injected ).toBe( module4 );
		});
		
		expect( returned ).toBe( module4 );
		expect( calls1 + calls2 + calls3 + calls4 ).toBe( 4 );
	});
	
	// 8) Require with dependencies
	it("should tolerate and fulfill redundant module requests.", function() {
		
		var content = "module content",
			calls = 0,
			returned;
		
		// Define a simple module which returns the "content" value.
		mmd.define('redundant', function() {
			calls++;
			return content;
		});
		
		// Require module redundantly.
		returned = mmd.require(['redundant', 'redundant'], function( a, b ) {
			expect( a ).toBe( content );
			expect( b ).toBe( content );
			return null;
		});
		
		expect( returned.length ).toBe( 2 );
		expect( returned[0] ).toBe( content );
		expect( returned[1] ).toBe( content );
		expect( calls ).toBe( 1 );
	});
	
	// 9) Require with circular dependencies
	it("should throw exception when circular dependencies are discovered.", function() {
		
		var module1 = "mod1",
			module2 = "mod2",
			module3 = "mod3",
			module4 = "mod4",
			returned;
		
		// Define a tree of modules with a circular reference.
		mmd.define('circ.1', ['circ.2'], function( mod2 ) {
			return module1;
		});
		mmd.define('circ.2', ['circ.3'], function( mod3 ) {
			return module2;
		});
		mmd.define('circ.3', ['circ.1'], function( mod1 ) {
			return module3;
		});
		mmd.define('circ.4', ['circ.4'], function( mod4 ) {
			return module4;
		});
		
		// Circular reference created among multiple modules.
		expect(function() {
			
			mmd.require( 'circ.1' );
			
		}).toThrow();
		
		// Self-requirement error.
		expect(function() {
			
			mmd.require( 'circ.4' );
			
		}).toThrow();
		
		try {
			mmd.require( 'circ.3' );
		} catch (e) {
			console.log(e);
		}
	});

	describe("MMD: 'exports' dependency", function() {
		it("should allow 'exports' dependency requirement", function() {
			mmd.define('export1', ['exports'], function(e) {});
			
			expect( function() {
				
				mmd.require(['export1']) 
				
			}).not.toThrow();
		});

		it("should provide 'exports' as an empty object", function() {
			mmd.define('export2', ['exports'], function(e) {});
			
			expect( mmd.require('export2') ).toEqual({});
		});

		it("should return the 'exports' object", function() {
			mmd.define('export3', ['exports'], function(exports) {
				exports.valid = true;

				return 'function-return';
			});

			expect ( mmd.require('export3') ).toEqual( { valid: true } );
		});
		
		it("should tolerate circular dependencies for modules using exports", function() {
			mmd.define('export4', ['exports', 'export5'], function(exports, module) {
				exports.name = 'export4';
				exports.dependency = module;
			});
			
			mmd.define('export5', ['exports', 'export4'], function(exports, module) {
				exports.name = 'export5';
				exports.dependency = module;
				
				expect(module).toEqual({});
			});
			
			expect ( mmd.require('export4').dependency.name).toEqual('export5');
		});
	});

	describe("MMD: Anonymous Definition Handling", function() {
		afterEach(function() {
			mmd.namespace.clear();
		});

		//verify initialization
		it("should begin with an empty id stack", function() {
			expect(mmd.namespace.list().length).toBe(0);
		});

		//verify adding a new ID
		it("should allow ids to be added", function() {
			mmd.namespace.add('first.id');

			expect(mmd.namespace.list().length).toBe(1);
			expect(mmd.namespace.list()[0]).toBe('first.id');
		});

		//verify removing a new ID
		it("should allow ids to be cleared", function() {
			mmd.namespace.add('first.id');
			mmd.namespace.clear();

			expect(mmd.namespace.list().length).toBe(0);
		});

		//verify anonymous definition after predefining IDs
		it("should allow anonymous definitions", function() {
			mmd.namespace
				.add('first.id')
				.add('second.id');

			expect(function() {
				mmd.define([], function() {});
			}).not.toThrow();

			expect(mmd.namespace.list().length).toBe(1);

			expect(function() {
				mmd.define([], function() {});
			}).not.toThrow();

			expect(mmd.namespace.list().length).toBe(0);
			
			expect(function() {
				mmd.define([], function() {});
			}).toThrow();
		});

		//verify anonymous definitions use correct stack IDs
		it("should use ordered ids in definitions", function() {
			var module1 = "mod1",
				module2 = "mod2",
				returned;
			
			mmd.namespace
				.add('ordered1.id')
				.add('ordered2.id');

			// Define a simple module which returns the "content" value.
			mmd.define(function() {
				return module1;
			});
			mmd.define(function() {
				return module2;
			});
			
			returned = mmd.require(['ordered1.id', 'ordered2.id'], function( mod1, mod2 ) {
				expect( mod1 ).toBe( module1 );
				expect( mod2 ).toBe( module2 );
			});
			
			expect( returned.length ).toBe( 2 );
			expect( returned[0] ).toBe( module1 );
			expect( returned[1] ).toBe( module2 );
		});

	});
});
