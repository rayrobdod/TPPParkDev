// ledgesim.js

//var THREE = require("three");
//var $ = require("jquery");
//var zip = zip.js

require("../polyfill.js");
var Map = require("../map");
var renderLoop = require("../model/renderloop");

require("../globals");

//On Ready
$(function(){
	
	gameState.playerSprite = "red[hg_vertmix-32].png";
	
	MapManager.transitionTo("xInfiniteLedge", 0);
	
	renderLoop.start({
		clearColor: 0x000000,
		ticksPerSecond : 20,
	});
	
});
