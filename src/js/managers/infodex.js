// infodex.js
// The manager for the infodex. Other managers defer to this 
// when calling functions for the infodex.

var inherits = require("inherits");
var extend = require("extend");
var EventEmitter = require("events").EventEmitter;

function Infodex() {
	var self = this;
	$(function(){
		self.breadcrumb = $("#dex-container .breadcrumb");
		self.searchbox = $("#dex-container .search input");
		self.contentarea = $("#dex-container .content");
		
		$("#dex-container .backbtn").click(function(){
			
		});
		$("#dex-container .fwdbtn").click(function(){
			
		});
		$("#dex-container .searchbtn").click(function(){
			
		});
	});
	
	this.history_back = [];
	this.history_fwd = [];
	this.fileSys = new zip.fs.FS();
}
inherits(Infodex, EventEmitter);
extend(Infodex.prototype, {
	history_back: null,
	history_fwd: null,
	
	file: null, //Zip file holding all data
	fileSys: null, //Current zip file system for this map
	xhr: null, //active xhr request
	loadError : null,
	
	/** Begin download of this map's zip file, preloading the data. */
	download : function(){
		if (this.file) return; //we have the file in memory already, do nothing
		if (this.xhr) return; //already got an active request, do nothing
		
		var self = this;
		var xhr = this.xhr = new XMLHttpRequest();
		xhr.open("GET", BASEURL+"/infodex.zip");
		// console.log("XHR: ", xhr);
		xhr.responseType = "blob";
		xhr.on("load", function(e) {
			// console.log("LOAD:", e);
			if (xhr.status == 200) {
				self.file = xhr.response;
				self.fileSys.importBlob(self.file, function success(){
					self.emit("downloaded");
				}, function error(e){
					console.error("ERROR: ", e);
				});
			} else {
				console.error("ERROR:", xhr.statusText);
				self.loadError = xhr.statusText;
			}
		});
		xhr.on("progress", function(e){
			// console.log("PROGRESS:", e);
			if (e.lengthComputable) {
				// var percentDone = e.loaded / e.total;
			} else {
				//marquee bar
			}
		});
		xhr.on("error", function(e){
			console.error("ERROR:", e);
			self.loadError = e;
		});
		xhr.on("canceled", function(e){
			console.error("CANCELED:", e);
			self.loadError = e;
		});
		//TODO on error and on canceled
		
		xhr.send();
	},
	
	openPage: function(id) {
		var self = this;
		if (this.file === null) {
			this.once("downloaded", function(){
				self.openPage(id);
			});
			this.download();
			return;
		}
		this.fileSys.find(id.replace(/\./g, "/") + ".html").getText(__pageLoaded, __logProgress);
		
		function __logProgress() {
			console.log("PROGRESS", arguments);
		}
		//Callback chain below
		function __pageLoaded(data) {
			// replace breadcrumb with one indicating this page
			self.breadcrumb.empty();
			id.split(".").reverse().forEach(function(part) {
				self.breadcrumb.append("<li><a>" + part + "</a></li>");
			});
			// replace content with page's contents
			self.contentarea.empty();
			self.contentarea.append(data);
		}
	},
});

module.exports = new Infodex();

