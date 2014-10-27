var streamStatusPanel = document.getElementById("streamStatusPanel");
var ONLINE_COLOR = "#208F15";
var OFFLINE_COLOR = "#F72A4C";
var DEFAULT_STREAMER_LOGO = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png";
var streamers;

var Streamer = {
	name: "",
	isLive: false,
	gameBeingPlayed: "",
	logoUrl: ""
};

function addStreamer()
{
	var newStreamer = Object.create(Streamer);
	var newStreamerName = document.getElementById("streamerInputBox").value;

	if (newStreamerName == "")
		return;
				
	if (newStreamerName.search(/[^a-zA-Z0-9_]/) != -1)
	{
		document.getElementById("errorBox").innerHTML = "Invalid streamer name";
		setTimeout(function() {document.getElementById("errorBox").innerHTML = ""}, 5000);
		return;
	}
			
	for (var i = 0; i < streamers.length; i++)
	{
		if (streamers[i].name == newStreamerName)
		{
			document.getElementById("errorBox").innerHTML = "Streamer already in list";
			setTimeout(function() {document.getElementById("errorBox").innerHTML = ""}, 5000);
			return;
		}
	}
			
	newStreamer.name = newStreamerName;
	document.getElementById("streamerInputBox").value = "";
	streamers.push(newStreamer);
	self.port.emit("saveStreamerList", streamers);
	buildInputPanelList();
}

function buildInputPanelList()
{
	var streamerList = document.getElementById("streamerList");
	
	while (streamerList.firstChild)
		streamerList.removeChild(streamerList.firstChild);
	
	for (var i = 0; i < streamers.length; i++)
	{
		var newStreamerBlock = document.createElement("div");
		newStreamerBlock.className = "streamerBlock";
		
		var streamerTitle = document.createElement("span");
		streamerTitle.className = "streamerTitle";
		streamerTitle.innerHTML = streamers[i].name;
		
		var removeButton = document.createElement("div");
		removeButton.className = "removeButton";
		removeButton.innerHTML = "X";
		removeButton.onclick = getRemoveButtonHandler(streamers[i]);
		
		newStreamerBlock.appendChild(streamerTitle);
		newStreamerBlock.appendChild(removeButton);
		
		streamerList.appendChild(newStreamerBlock);
	}
}

function getRemoveButtonHandler(streamer)
{
	return function()
		{
			streamers.splice(streamers.indexOf(streamer), 1);
			self.port.emit("saveStreamerList", streamers);
			buildInputPanelList();
		};
}

self.port.on("createEmptyBlock", function createEmptyBlock(streamerName)
	{
		var newBlock = document.createElement("div");
		newBlock.className = "streamerBlock";
		newBlock.id = "streamerBlock-" + streamerName;
		
		var streamerLogo = document.createElement("img");
		streamerLogo.id = "streamerLogo-" + streamerName;
		streamerLogo.className = "streamerLogo";
		streamerLogo.src = DEFAULT_STREAMER_LOGO;
		
		var statusBlock = document.createElement("div");
		statusBlock.className = "statusBlock";
		
		var streamerTitle = document.createElement("a");
		streamerTitle.id = "streamerTitle-" + streamerName;
		streamerTitle.className = "streamerTitle";
		streamerTitle.innerHTML = streamerName;
		
		var streamerStatus = document.createElement("span");
		streamerStatus.id = "streamerStatus-" + streamerName;
		streamerStatus.className = "streamerStatus";
		
		statusBlock.appendChild(streamerTitle);
		statusBlock.appendChild(document.createElement("br"));
		statusBlock.appendChild(streamerStatus);
		
		newBlock.appendChild(streamerLogo);
		newBlock.appendChild(statusBlock);
		
		newBlock.onclick = function()
		{
			self.port.emit("gotoStream", streamerName);
		};
	
		streamStatusPanel.appendChild(newBlock);
	}
);

self.port.on("setStreamerLogo", function setStreamerLogo(streamerName, streamerLogoUrl)
	{
		var logoElement = document.getElementById("streamerLogo-" + streamerName);
		logoElement.src = streamerLogoUrl;
	}
);

self.port.on("setRetrieving", function setRetrieving(streamerName)
	{
		document.getElementById("streamerStatus-" + streamerName).style.color = "#FFFFFF";
		document.getElementById("streamerStatus-" + streamerName).innerHTML = "Retrieving...";
	}
);

self.port.on("setStatus", function setStatus(streamerName, isLive, gameName, exists)
	{
		if (exists)
		{
			document.getElementById("streamerStatus-" + streamerName).style.color = isLive ? ONLINE_COLOR : OFFLINE_COLOR;
			document.getElementById("streamerStatus-" + streamerName).innerHTML = isLive ? ("Live - " + gameName) : "Offline";
		}
		else
		{
			document.getElementById("streamerStatus-" + streamerName).style.color = OFFLINE_COLOR;
			document.getElementById("streamerStatus-" + streamerName).innerHTML = "This user does not exist!";
		}
	}
);

self.port.on("changeNoStreamerMessage", function changeNoStreamerMessage(show)
	{
		if (show)
			document.getElementById("noStreamerMessage").innerHTML = "Your stream list is empty!";
		else
			document.getElementById("noStreamerMessage").innerHTML = "";
	}
);

self.port.on("setClickListeners", function setClickListeners()
	{
		document.getElementById("streamersButton").onclick = function()
		{
			self.port.emit("openStreamersPanel");
		};
	}
);

self.port.on("clearStreamList", function clearStreamList()
	{
		while (streamStatusPanel.firstChild)
			streamStatusPanel.removeChild(streamStatusPanel.firstChild);
	}
);

self.port.on("setupInputPanel", function setupInputPanel(streamerList)
	{
		document.getElementById("addStreamerButton").onclick = function() 
		{
			addStreamer();
		};
		
		document.getElementById("streamerInputBox").onkeydown = function(event) 
		{
			if (event.keyCode == 13)
				addStreamer();
		};
		
		document.getElementById("saveButton").onclick = function() 
		{
			document.getElementById("streamerInputBox").value = "";
			self.port.emit("closeInputPanel");
		};
		
		if (streamerList != null)
		{
			streamers = streamerList;
			buildInputPanelList();
		}
		else
			streamerList = [];
	}
);