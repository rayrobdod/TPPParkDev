// game.js

//var THREE = require("three");
//var $ = require("jquery");
//var zip = zip.js

require("./polyfill.js");
var Map = require("./map");
var renderLoop = require("./model/renderloop");

require("./globals");


//On Ready
$(function(){
	
	// currentMap = new Map("iChurchOfHelix");
	// currentMap.load();
	MapManager.transitionTo();
	Infodex.openPage("game.crystal.trainer.ajdowns");
	
	renderLoop.start({
		clearColor : 0xFF0000,
		ticksPerSecond : 20,
	});
	
});

function loadMap(id) {
	if (currentMap) {
		currentMap.dispose();
		_infoParent = null;
		_node_movementGrid = null;
	}
	
	currentMap = new Map(id);
	currentMap.load();
}
window.loadMap = loadMap;
