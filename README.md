# Micro Module Definition (MMD)

[![Build Status](https://travis-ci.org/Billiam/micro-module-definition.png?branch=master)](https://travis-ci.org/Billiam/micro-module-definition)

MMD is a tiny (1.1kb / 0.66kb-gzipped) synchronous module definition and dependency management framework, built around a familiar define/require interface. While its API is modeled after AMD and CommonJS, MMD technically conforms to neither spec. Its intent is much smaller. Major frameworks such as [Require.js](http://requirejs.org/ "Require.js") and [curl.js](https://github.com/cujojs/curl "curl.js") are great for big projects, but can be overkill for tiny (< 5kb) web applications contained in a single script file. MMD is designed to provide module definition, lazy parsing, and dependency injection for those micro applications using a familiar API that adds little overhead weight.

The `mmd` API has six methods:
 - [`define`](#define)
 - [`require`](#require)
 - [`undef`](#undef)
 - [`namespace.add`](#namespaceadd)
 - [`namespace.list`](#namespacelist)
 - [`namespace.clear`](#namespaceclear)

## define()

The `define` method creates a module definition.

```javascript
mmd.define( "moduleId", [dependencies]?, factoryFunction );
```

- `"moduleId"?` : *Optional, see namespace.add*. Unique string identifier for this module.
- `[dependencies]?` : *Optional*. Array of dependency module ids to be required and injected into the module's scope.
- `factoryFunction` : *Required*. Function used to build the module. This function should provide arguments mapped to the module's dependencies, and return the constructed module export.

The complete usage of `define` allows:
```javascript
// 1) Define a module without dependencies.
mmd.define("module1", function() {
	return {}; // << module export object.
});

// 2) Define a module with a single dependency.
mmd.define("module2", ["module1"], function( mod1 ) {
	return {};
});

// 3) Define a module with multiple dependencies.
mmd.define("main", ["module1", "module2"], function( mod1, mod2 ) {
	return {};
});

// 4) Define a module using the 'exports' dependency.
// the exports variable will be used as the public API for the defined module
mmd.define("module3", ["exports"], function(exports) {
	exports.publicMethod = function() {};
	exports.publicMethod2 = function() {};
	
	return 'this will not be returned';
});

// Require a module to load it...
mmd.require("main");
```
While listing module dependencies, you may include `"mmd"` as an identifier to have MMD provide a reference to itself. This is handy for including a local reference to MMD within an encapsulated module scope. While a module can technically reference MMD through the scope chain, local references keep things tidy.

```javascript
mmd.define("demo", function() {
	return {};
});

// Require "mmd" as a local resource, then use it to require other modules.
mmd.define("main", ["mmd"] function( mmd ) {
	if ( window.isDemo ) {
		mmd.require( "demo" );
	}
});

mmd.require("main");
```

Modules may be defined in any order, however, all `define` calls should precede your first `require` call. A good practice is to define a `"main"` module for launching your application, and then require `"main"` as your final line of code. For example, here's a simple modular application pattern:

```javascript
// 1) Create an application scope...
(function() {
	"use strict";
	
	// 2) Define all application modules...
	mmd.define("module1", function() {
		return {};
	});
	
	mmd.define("module2", function() {
		return {};
	});
	
	// 3) Define a "main" module for bootstrapping your application...
	mmd.define("main", ["mmd"], function( mmd ) {
		if ( window.someCondition ) {
			mmd.require( ["module1", "module2"] );
		}
	});
	
	// 4) Require "main" to run your application.
	mmd.require("main");
}());
```

## require()

The `require` method builds/accesses a module or collection of modules. Modules and their dependencies are built the first time they are required. Built modules are returned by the `require` method, *and* injected into an optional callback.

```javascript
var module = mmd.require( ["moduleId"], callbackFunction? );
```

- `["moduleId"]` : *Required*. The string identifier of a single module, *or* an array of module ids.
- `callbackFunction?` : *Optional*. Callback function into which the required modules are injected. Provide mapped arguments.
- `return` : A single module is returned when a single id string is required; an array of modules is returned when an array of module ids are required.

The complete usage of `require` allows:

```javascript
// 1) Return a single module by direct id reference.
var module = mmd.require('module1');

// 2) Inject a single module as an argument of a callback function.
mmd.require('module1', function( mod1 ) {
	// do stuff.
});

// 3) Return an array of modules mapped to a list of required ids.
var moduleArray = mmd.require(['module1', 'module2']);

// 4) Inject a collection of modules as arguments of a callback function.
mmd.require(['module1', 'module2'], function( mod1, mod2 ) {
	// do stuff.
});

// 5) OR, do all of the above... return AND inject one or more modules with a single require call.
var returned = mmd.require(['module1', 'module2'], function( mod1, mod2 ) {
	// do stuff.
});
```

Which came first, the chicken or the egg? MMD doesn't care to figure it out, so throws an exception when a circular reference is required. Avoid circular references; you should probably be rethinking your organization anyway if you encounter this problem.

## undef()
The `undef` method removes defined modules from `mmd`.

```html
<script type="text/javascript">
	// define anonymous modules
	mmd.define('module1', function(){ return 'module' } );
	
	console.log( mmd.require('module1') );
	// > 'module'
	mmd.undef('module1');
	mmd.require('module');
	//> exception "module is undefined"
	
</script>
```

## namespace.add()

`mmd` also uses a list of module namespaces (normally empty) which will be used when defining modules anonymously. 
The `namespace.add` method will add a new module namespace to this list, which will be used for the next anonymous module definition. 
The namespace list is first-in-last-out, and expects namespaces to be defined in order of use.

If no module namespaces have been predefined, an exception will be thrown when defining an anonymous module.

Usage:

```javascript
// 1) Predefine module names:
mmd.namespace.add('module1');
mmd.namespace.add('module2');

// 2) Define modules anonymously:
mmd.define(function() {
	return 'this is module 1';
});
mmd.define(function(){
	return 'this is module 2';
});

// 3) Require modules by name
mmd.require(['module1', 'module2'], function(module1, module2) {
	// ...
});
```

If a global `mmd` array is defined before `mmd.js` is loaded, the array will be used as the module namespace list.

```html
<script type="text/javascript">
	// define a list of module namespaces
	var mmd = [
		'module1',
		'module2',
		'module3'
	];
</script>
<script type="text/javascript" src="mmd.js"></script>
<script type="text/javascript">
	// define anonymous modules
	mmd.define(function(){
		return 'this is module 1';
	});

	//... etc
</script>
```

## namespace.list()

Lists defined but unused module namespaces, useful when debugging.

## namespace.clear()

Remove all predefined module namespaces from the internal list

## Go Global

MMD is designed to be small and unimposing; consider copying and pasting the minified MMD script directly into your application scope rather than including a separate script file. The `mmd` namespace variable will be local to the scope in which you place it.

However, if you'd prefer the AMD-style of having define/require as global methods, simply assign global aliases to the MMD methods, and you're up and running...

```javascript
// Assign global references (at your own risk!)
window.define = mmd.define;
window.require = mmd.require;

// Proceed with global calls:
define("demo", function() {});
require("demo");
```

Please be a responsible web citizen... make sure you don't hijack another framework's define/require methods within global scope.
