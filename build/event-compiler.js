// event-compiler.js
// A function that finds compiles global events

var Browserify = require("browserify");
var sync = require("synchronize");
var extend = require("extend");
var fs = require("fs");

var stream = require("stream");

var ByLineReader = require("./transform-streams").ByLineReader;
var ProcessorTransform = require("./transform-streams").ProcessorTransform;

global.EXTERNAL_EVENT_LIBS = [];

// Reason behind making global event names unique: they're all going to get folders in the
// packed map zip files, and they'll need to be unique there. Unless we put some much more
// difficult to enforce restriction on how Lord Helix and Lard Helix can't be in the same
// place at the same time.
function uniqueCheckGlobalEvents() {
	var eventNames = {};
	
	for (var pi = 0; pi < EVENT_DIRS.length; pi++) {
		if (!fs.existsSync(EVENT_DIRS[pi])) continue;
		
		var dirListing = fs.readdirSync(EVENT_DIRS[pi]);
		for (var di = 0; di < dirListing.length; di++) {
			var file = dirListing[di];
			if (!fs.existsSync(EVENT_DIRS[pi] + file + "/base.js")) continue;
			
			if (eventNames[file]) 
				throw new Error("Found a duplicate event folder! Original:", eventNames[file], " Dupe:", EVENT_DIRS[pi]);
			eventNames[file] = EVENT_DIRS[pi];
		}
	}
	
	console.log("[Event] Found", Object.keys(eventNames).length, "global events.");
}
module.exports.uniqueCheckGlobalEvents = uniqueCheckGlobalEvents;


function createEventLibraryBundle(outfile) {
	// Browserify the Event Library classes together
	var bundler = new Browserify({
		noParse : ["three", "jquery"],
		debug : true,
	});
	
	bundler.exclude("three");
	bundler.exclude("jquery");
	
	bundler.require("extend",		{ expose: "extend" });
	bundler.require("inherits",		{ expose: "inherits" });
	
	bundler.require("./src/js/events/event",			{ expose: "tpp-event" });
	bundler.require("./src/js/events/trigger",			{ expose: "tpp-trigger" });
	bundler.require("./src/js/events/warp",				{ expose: "tpp-warp" });
	bundler.require("./src/js/events/actor",			{ expose: "tpp-actor" });
	bundler.require("./src/js/events/sign",				{ expose: "tpp-sign" });
	bundler.require("./src/js/events/animevent",		{ expose: "tpp-animevent" });
	bundler.require("./src/js/events/camera-trigger",	{ expose: "tpp-cameratrigger" });
	bundler.require("./src/js/events/particle-system",	{ expose: "tpp-particle" });
	
	bundler.require("./src/js/events/player-character",	{ expose: "tpp-pc" });
	bundler.require("./src/js/events/actor_animations",	{ expose: "tpp-actor-animations" });
	bundler.require("./src/js/events/behavior",			{ expose: "tpp-behavior" });
	bundler.require("./src/js/managers/controller",		{ expose: "tpp-controller" });
	bundler.require("./src/js/model/spritemodel",		{ expose: "tpp-spritemodel" });
	bundler.require("./src/js/model/model-mods",		{ expose: "tpp-model-mods" });
	
	bundler.require("./src/js/events/tGallery",		{ expose: "tpp-test-gallery" });
	
	// This function will collect all the exposed labels, in a process similar to passing
	// this not-yet-bundled bundler to another bundler through external().
	bundler.on("label", function(prev, id){
		if (typeof id == "string")
			EXTERNAL_EVENT_LIBS.push(id);
	});
	
	bundler.plugin("minifyify", {
		map: "_srcmaps/maps/events.map.json",
		output: "_srcmaps/maps/events.map.json",
		minify: MINIFY,
	});
	
	var data = sync.await(bundler.bundle(sync.defer()));
	fs.writeFileSync(BUILD_OUT+"js/eventlib.js", data);
	console.log("[EvLib] Bundled event library."); 
	//return data;
}
module.exports.createEventLibraryBundle = createEventLibraryBundle;


function findGlobalEvents(mapid) {
	var eventPaths = [];
	var eventConfigs = {};
	
	for (var pi = 0; pi < EVENT_DIRS.length; pi++) {
		if (!fs.existsSync(EVENT_DIRS[pi])) continue;
		
		var dirListing = fs.readdirSync(EVENT_DIRS[pi]);
		for (var di = 0; di < dirListing.length; di++) {
			var file = dirListing[di];
			if (!fs.existsSync(EVENT_DIRS[pi] + file + "/base.js")) continue;
			// console.log("[Event] Found event:", file, ">", EVENT_DIRS[pi]+file+"/base.js");
			
			if (!fs.existsSync(EVENT_DIRS[pi] + file + "/"+mapid+".js")) continue;
			console.log("[Event] Found event for map:", file, ">", EVENT_DIRS[pi]+file+"/"+mapid+".js");
			
			eventConfigs[file] = loadSpriteConfig(EVENT_DIRS[pi] + file, mapid);
			// console.log("Event Config for", file, "::", eventConfigs[file]);
			
			eventPaths.push("./"+EVENT_DIRS[pi] + file + "/"+mapid+".js");
		}
	}
	
	if (!eventPaths.length) return null;
	return {
		configs: eventConfigs,
		bundle: tryWrapCatch(bundle(eventPaths, mapid, "global"), "Global event loading exploded."),
	};
}
module.exports.findGlobalEvents = findGlobalEvents;


function findLocalEvents(mapid, path) {
	if (!fs.existsSync(path+"/events.js")) return null;
	
	var config;
	{
		var databuffer = [];
		var file_reader = fs.createReadStream(path+"/events.js");
		file_reader.pipe(getPackConfigExtractorTransform()).on('data', function(chunk){
			databuffer.push(chunk.toString());
		}).on('end', sync.defer());
		
		sync.await();
		
		// console.log("Databuffer 1:", databuffer); sleep(100);
		
		if (databuffer.length) config = JSON.parse(databuffer.join(" "));
		else config = {};
	}
	
	return {
		configs: config,
		bundle: tryWrapCatch(bundle("./"+path+"/events.js", mapid, "local"), "Local event loading exploded."),
	};
}
module.exports.findLocalEvents = findLocalEvents;




function bundle(srcs, mapid, type) {
	// Browserify the events together
	var bundler = new Browserify({
		noParse : ["three", "jquery"],
		debug : true,
		insertGlobalVars : {
			add : function() { return "function(a){ currentMap.addEvent(a); }"; },
			map : function() { return "currentMap"; },
		},
	});
	bundler.add(srcs);
	
	bundler.transform(getPackConfigRemoverTransform);
	
	bundler.exclude("three");
	bundler.exclude("jquery");
	
	// Externalize the Event Library
	bundler.external(EXTERNAL_EVENT_LIBS);
	bundler.plugin("minifyify", {
		map: SRC_MAPS+"/maps/"+mapid+"/"+type+".map.json",
		output: SRC_MAPS+"/maps/"+mapid+"/"+type+".map.json",
		minify: MINIFY,
	});
	
	var data = sync.await(bundler.bundle(sync.defer()));
	console.log("[Event] Bundled", (typeof srcs == "string")?1:srcs.length, type, "events."); 
	return data;
}


function loadSpriteConfig(file, mapid) {
	var databuffer = [];
	var file_reader = fs.createReadStream(file+"/base.js");
	file_reader.pipe(getPackConfigExtractorTransform()).on('data', function(chunk){
		databuffer.push(chunk.toString());
	}).on('end', sync.defer());
	
	sync.await();
	
	// console.log("Databuffer 1:", databuffer); sleep(100);
	
	var config;
	if (databuffer.length) config = JSON.parse(databuffer.join(" "));
	else config = {};
	
	
	databuffer.length = 0;
	file_reader = fs.createReadStream(file+"/"+ mapid+".js");
	file_reader.pipe(getPackConfigExtractorTransform()).on('data', function(chunk){
		databuffer.push(chunk.toString());
	}).on('end', sync.defer());
	
	sync.await();
	
	// console.log("Databuffer 2:", databuffer); sleep(100);
	
	if (databuffer.length) extend(config, JSON.parse(databuffer.join(" ")));
	
	config["__path"] = file;
	return config;
}



function tryWrapCatch(src, msg) {
	//*
	return src;
	/*/
	return "try {\n"+
		src +
	"\n} catch (e) {\n" +
	'\tconsole.error("'+msg+'", e, e.stack);\n' +
	"}"; //*/
}




function getPackConfigRemoverTransform() {
	return getPackConfigTransform(false);
}

function getPackConfigExtractorTransform() {
	return getPackConfigTransform(true);
}

function getPackConfigTransform(extract) {
	var trans = new stream.Transform({ objectMode : true });
	trans._transform = function(chunk, encoding, doneFn) {
		var data = chunk.toString();
		if (this._lastLineData) 
			data = this._lastLineData + data;
		
		var lines = data.split("\n");
		this._lastLineData = lines.splice(lines.length-1, 1)[0];
		
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.indexOf("//$ PackConfig") == 0) { this._isInConfig = true; continue; }
			if (line.indexOf("//$!") == 0) { this._isInConfig = false; continue; }
			
			if (this._isInConfig != extract) continue;
			this.push(lines[i]);
		}
		
		doneFn();
	};
	trans._flush = function(doneFn) {
		if (this._lastLineData && this._isInConfig == extract) 
			this.push(this._lastLineData);
		this._lastLineData = null;
		doneFn();
	};
	trans._isInConfig = false;
	return trans;
}


