var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var simpleStorage = require("sdk/simple-storage");
var timing = require("sdk/timers");
var request = require("sdk/request").Request;
var data = self.data;

var streamers = [];
var streamsProcessed = 0;
var liveStreamCount = 0;

var Streamer = {
	name: "",
	isLive: false,
	gameBeingPlayed: "",
	logoUrl: ""
};

var streamListPanel = require("sdk/panel").Panel(
	{
		width: 270,
		height: 246,
		contentURL: data.url("streamListPanel.html"),
		contentScriptFile: data.url("panelController.js")
	}
);

var streamInputPanel = require("sdk/panel").Panel(
	{
		width: 275,
		height: 270,
		contentURL: data.url("streamInputPanel.html"),
		contentScriptFile: data.url("panelController.js")
	}
);

var widget = widgets.Widget(
	{
		width: 35,
		id: "twitchStreamNotifier",
		label: "Stream Notifier",
		contentURL: data.url("icon.html"),
		contentScriptFile: data.url("widgetController.js"),
		panel: streamListPanel
	}
);

function getStreamStatus(streamName)
{
	var getJson = request(
	{
		url: "https://api.twitch.tv/kraken/streams/" + streamName + "?client_id=oq4l8ej5xhlwn3qylo6pxf2zqwgr5ki",
	    onComplete: function (response) 
		{
			var isLive = (response.json["stream"] != null);
			var gameName = isLive ? response.json["stream"]["channel"]["game"] : "";			
			
			for (var i = 0; i < streamers.length; i++)
			{
				if (streamers[i].name == streamName)
				{
					streamers[i].isLive = isLive;
					streamers[i].gameBeingPlayed = gameName;
					break;
				}
			}
			
			if (response.json["status"] != 404)
				streamListPanel.port.emit("setStatus", streamName, isLive, gameName, true);
			else
				streamListPanel.port.emit("setStatus", streamName, false, "", false);
			liveStreamCount += (isLive ? 1 : 0);
			
			if (++streamsProcessed == streamers.length)
				widget.port.emit("setLiveCount", liveStreamCount);
		}
	}).get();
}

function gatherStreamStatuses()
{
	if (streamers.length != 0)
	{
		liveStreamCount = 0;
		streamsProcessed = 0;
		
		for (var i = 0; i < streamers.length; i++)
		{
			streamListPanel.port.emit("setRetrieving", streamers[i].name);
			getStreamStatus(streamers[i].name);
		}
		
		streamListPanel.port.emit("changeNoStreamerMessage", false);
	}
	else
	{
		widget.port.emit("setLiveCount", -1);
		streamListPanel.port.emit("changeNoStreamerMessage", true);
	}
}

function buildStreamerList()
{
	streamListPanel.port.emit("clearStreamList");
	
	if (simpleStorage.storage.streamerList != null)
	{
		streamers = simpleStorage.storage.streamerList;

		if (streamers.length != 0)
		{
			for (var i = 0; i < streamers.length; i++)
			{
				streamListPanel.port.emit("createEmptyBlock", streamers[i].name);
				scrapeLogo(streamers[i].name);
			}
		}
		
		gatherStreamStatuses();
	}
}

function scrapeLogo(streamerName)
{
	var imageGrabber = request(
	{
		url: "http://www.twitch.tv/" + streamerName + "/profile",
		onComplete: function (response)
		{
			var start = response.text.search("http://static-cdn.jtvnw.net/jtv_user_pictures");
			var streamerLogoUrl = response.text.substr(start, response.text.substr(start, response.text.length).search("'"));
			
			if (start == -1)
				return;
				
			for (var i = 0; i < streamers.length; i++)
			{
				if (streamers[i].name == streamerName)
					streamers[i].logoUrl = streamerLogoUrl;
			}
			
			streamListPanel.port.emit("setStreamerLogo", streamerName, streamerLogoUrl);
		}
	}).get();
}

function attachClickListeners()
{
	streamListPanel.port.emit("setClickListeners");
}

streamListPanel.port.on("gotoStream", function openPage(streamerName)
	{
		for (var i = 0; i < streamers.length; i++)
		{
			if (streamers[i].name == streamerName)
			{
				if (streamers[i].isLive)
					tabs.open("http://www.twitch.tv/" + streamerName);
				else
					tabs.open("http://www.twitch.tv/" + streamerName + "/profile/past_broadcasts");
				break;
			}
		}
		
		streamListPanel.hide();
	}
);

streamInputPanel.port.on("saveStreamerList", function saveStreamerList(streamerList)
	{
		simpleStorage.storage.streamerList = streamerList;
		buildStreamerList();
	}
);

streamInputPanel.port.on("closeInputPanel", function saveStreamerList(streamerList)
	{
		streamInputPanel.hide();
	}
);

widget.port.on("openStreamList", function openStreamList()
	{
		streamListPanel.show();
	}
);

streamListPanel.port.on("openStreamersPanel", function openStreamList()
	{
		streamInputPanel.port.emit("setupInputPanel", streamers);
		streamInputPanel.show();
	}
);

attachClickListeners();
buildStreamerList();
gatherStreamStatuses();
timing.setInterval(gatherStreamStatuses, 10000);