// eSouthSurldab/events.js
// Events for South Surldab

//$ PackConfig
{
	"sprites" : [
		"../../events/_spriteRepo/builder.png"
	] 
}
//$!

var Actor = require("tpp-actor");
var Trigger = require("tpp-trigger");
var Warp = require("tpp-warp");
var Event = require("tpp-event");
var AnimEvent = require("tpp-animevent");

var fountainRunning = !!DEBUG._fountainRuns;

////////////////////////// Model Modifications ///////////////////////////
$(function() {
	var ModelMods = require("tpp-model-mods");
	
	ModelMods.trees.prefix = "Tree";
	ModelMods.renderDepthFix.name = ["BasketballCourt"];
	
	if (fountainRunning) {
		ModelMods.hide.prefix = "FountainStill";
	} else {
		ModelMods.hide.prefix = "FountainFlow";
	}
	
	ModelMods.modify();
});

///////////////////////////// Construction ///////////////////////////////

var barrierGeom; //Geometry for the saw horse barrier blocking unconstructed exits.


//////////////////////////////// Warps ////////////////////////////////////

add(new Warp({ //warp 00
	id: "EXIT_walkwayLegends",
	locations: [56, 61, 3, 2],
	exit_to: { map: "xWalkwayLegends", warp: 0 },
}));

add(new Warp({ //01
	id: "EXIT_stadiumPathway",
	locations: [111, 25, 1, 3],
	exit_to: { map: "eStadiumPath", warp: 0 },
}));

add(new Warp({ //02
	id: "EXIT_gatorPlains",
	locations: [3, 25, 1, 3],
	exit_to: { map: "eGatorPlains", warp: 0 },
}));

add(new Warp({ //03
	id: "EXIT_northLeft",
	locations: [40, 2, 3, 1],
	exit_to: { map: "eNorthSurldab", warp: 0x01 },
}));

add(new Warp({ //04
	id: "EXIT_northRight",
	locations: [72, 2, 3, 2],
	exit_to: { map: "eNorthSurldab", warp: 0x02 },
}));



add(new Warp({ //10
	id: "EXIT_church",
	locations: [57, 21],
	exit_to: { map: "iChurchOfHelix", warp: 0 },
}));

add(new Warp({ //11
	id: "EXIT_pokemart",
	locations: [34, 40],
	exit_to: { map: "iPokeMart", warp: 0 },
}));

add(new Warp({ //12
	id: "EXIT_pokecenter",
	locations: [79, 40],
	exit_to: { map: "iPokeCenter", warp: 0 },
}));

add(new Warp({ //13
	id: "EXIT_casinoSouth",
	locations: [99, 24],
	exit_to: { map: "iCasino", warp: 1 },
}));

add(new Warp({ //14
	id: "EXIT_casinoSouth",
	locations: [93, 15],
	exit_to: { map: "iCasino", warp: 0 },
}));

add(new Warp({ //15
	id: "EXIT_crystalFlats",
	locations: [10, 34],
	exit_to: { map: "iCrystalFlats", warp: 0 },
}));

add(new Warp({ //16
	id: "EXIT_burrito",
	locations: [19, 56],
	exit_to: { map: "iBurritoEmporium", warp: 0 },
}));

add(new Warp({ //17
	id: "EXIT_postOffice_person",
	locations: [66, 22],
	exit_to: { map: "iPostOffice", warp: 0 },
}));

add(new Warp({ //18
	id: "EXIT_postOffice_kenya",
	locations: [71, 16, 1, 2],
	exit_to: { map: "iPostOffice", warp: 1 },
}));
add(new Trigger({ //18
	id: "EXIT_postOffice_kenyaTrigger",
	locations: [70, 16, 1, 2],
	//TODO trigger Kenya to exit this map
}));

add(new Warp({ //19
	id: "EXIT_hallOfFame",
	locations: [49, 22],
	exit_to: { map: "iHallOfFame", warp: 0 },
}));


//////////////////////////// Geometry Items ///////////////////////////////

if (fountainRunning) {
	add(new AnimEvent.Water({
		speed: -0.05,
		named_regex: /^FountainFlow/i,
	}));
} else {
	add(new AnimEvent.SineRipple({
		named_regex: /^FountainStill/i,
	}));
}

add(new AnimEvent({
	id: "ANIM_MartSignSpin",
	location: [38, 40],
	getAvatar : function(map) {
		var node = map.mapmodel.getObjectByName("PokeMartSign");
		
		if (!node.children[0]) return;
		if (!node.children[0].geometry) return;
		var center = node.children[0].geometry.boundingSphere.center;
		
		var parent = new THREE.Object3D();
		parent.position.set(center);
		
		node.parent.add(parent);
		parent.add(node);
		//node.position.set(center.negate());
		node.traverse(function(obj){
			if (!obj.geometry) return;
			obj.geometry.center(obj.geometry);
			obj.geometry.computeBoundingSphere();
		})
		
		this.sign_node = parent;
		
		return null;
	},
	onTick : function(delta) {
		this.sign_node.rotateY(delta * 0.05);
	},
}))

