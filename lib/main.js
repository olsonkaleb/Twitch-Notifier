var TwitchTracker_widgetModule = require("sdk/widget");
var TwitchTracker_tabsModule = require("sdk/tabs");
var TwitchTracker_selfModule = require("sdk/self");
var TwitchTracker_storageModule = require("sdk/simple-storage");
var TwitchTracker_timingModule = require("sdk/timers");
var TwitchTracker_requestModule = require("sdk/request").Request;

var TwitchTracker_streamers = [];

var TwitchTracker_streamListPanel = require("sdk/panel").Panel(
	{
		width: 270,
		height: 600,
		contentURL: TwitchTracker_selfModule.data.url("streamListPanel.html"),
		contentScriptFile: TwitchTracker_selfModule.data.url("panelController.js")
	}
);

var TwitchTracker_streamInputPanel = require("sdk/panel").Panel(
	{
		width: 275,
		height: 270,
		contentURL: TwitchTracker_selfModule.data.url("streamInputPanel.html"),
		contentScriptFile: TwitchTracker_selfModule.data.url("panelController.js")
	}
);

var TwitchTracker_widget = TwitchTracker_widgetModule.Widget(
	{
		width: 35,
		id: "twitchStreamNotifier",
		label: "Stream Notifier",
		contentURL: TwitchTracker_selfModule.data.url("icon.html"),
		contentScriptFile: TwitchTracker_selfModule.data.url("widgetController.js"),
		panel: TwitchTracker_streamListPanel
	}
);

function getStreamStatus(streamName)
{
	var getJson = TwitchTracker_requestModule(
	{
		url: "https://api.twitch.tv/kraken/streams/" + streamName + "?client_id=oq4l8ej5xhlwn3qylo6pxf2zqwgr5ki",
	    onComplete: function (response) 
		{
			var isLive = (response.json["stream"] != null);
			var gameName = isLive ? response.json["stream"]["channel"]["game"] : "";			
			
			for (var i = 0; i < TwitchTracker_streamers.length; i++)
			{
				if (TwitchTracker_streamers[i].name == streamName)
				{
					TwitchTracker_streamers[i].isLive = isLive;
					TwitchTracker_streamers[i].gameBeingPlayed = gameName;
					break;
				}
			}
			
			if (response.json["status"] != 404)
				TwitchTracker_streamListPanel.port.emit("setStatus", streamName, isLive, gameName, true);
			else
				TwitchTracker_streamListPanel.port.emit("setStatus", streamName, false, "", false);
			
			if (isLive)
				TwitchTracker_widget.port.emit("changeLiveCount", 1);
		}
	}).get();
}

function gatherStreamStatuses()
{
	if (TwitchTracker_streamers.length != 0)
	{
		TwitchTracker_widget.port.emit("changeLiveCount", 0);
		
		for (var i = 0; i < TwitchTracker_streamers.length; i++)
		{
			TwitchTracker_streamListPanel.port.emit("setRetrieving", TwitchTracker_streamers[i].name);
			getStreamStatus(TwitchTracker_streamers[i].name);
		}
		
		TwitchTracker_streamListPanel.port.emit("changeNoStreamerMessage", false);
	}
	else
	{
		TwitchTracker_widget.port.emit("changeLiveCount", -1);
		TwitchTracker_streamListPanel.port.emit("changeNoStreamerMessage", true);
	}
}

function buildStreamerList()
{
	TwitchTracker_streamListPanel.port.emit("clearStreamList");
	
	if (TwitchTracker_storageModule.storage.streamerList != null)
	{
		TwitchTracker_streamers = TwitchTracker_storageModule.storage.streamerList;

		if (TwitchTracker_streamers.length != 0)
		{
			for (var i = 0; i < TwitchTracker_streamers.length; i++)
			{
				TwitchTracker_streamListPanel.port.emit("createEmptyBlock", TwitchTracker_streamers[i].name);
				scrapeLogo(TwitchTracker_streamers[i].name);
			}
		}
		
		gatherStreamStatuses();
	}
}

function scrapeLogo(streamerName)
{
	var imageGrabber = TwitchTracker_requestModule(
	{
		url: "http://www.twitch.tv/" + streamerName + "/profile",
		onComplete: function (response)
		{
			var start = response.text.search("http://static-cdn.jtvnw.net/jtv_user_pictures");
			var streamerLogoUrl = response.text.substr(start, response.text.substr(start, response.text.length).search("'"));
			
			if (start == -1)
				return;
				
			for (var i = 0; i < TwitchTracker_streamers.length; i++)
			{
				if (TwitchTracker_streamers[i].name == streamerName)
					TwitchTracker_streamers[i].logoUrl = streamerLogoUrl;
			}
			
			TwitchTracker_streamListPanel.port.emit("setStreamerLogo", streamerName, streamerLogoUrl);
		}
	}).get();
}

function attachClickListeners()
{
	TwitchTracker_streamListPanel.port.emit("setClickListeners");
}

TwitchTracker_streamListPanel.port.on("gotoStream", function gotoStream(streamerName)
	{
		for (var i = 0; i < TwitchTracker_streamers.length; i++)
		{
			if (TwitchTracker_streamers[i].name == streamerName)
			{
				if (TwitchTracker_streamers[i].isLive)
					TwitchTracker_tabsModule.open("http://www.twitch.tv/" + streamerName);
				else
					TwitchTracker_tabsModule.open("http://www.twitch.tv/" + streamerName + "/profile/past_broadcasts");
				break;
			}
		}
		
		TwitchTracker_streamListPanel.hide();
	}
);

TwitchTracker_widget.port.on("openStreamList", function openStreamList()
	{
		TwitchTracker_streamListPanel.show();
	}
);

TwitchTracker_streamListPanel.port.on("openInputPanel", function openInputList()
	{
		TwitchTracker_streamInputPanel.port.emit("setupInputPanel", TwitchTracker_streamers);
		TwitchTracker_streamInputPanel.show();
	}
);

TwitchTracker_streamInputPanel.port.on("closeInputPanel", function closeInputPanel(streamerList)
	{
		TwitchTracker_streamInputPanel.hide();
	}
);

TwitchTracker_streamInputPanel.port.on("saveStreamerList", function saveStreamerList(streamerList)
	{
		TwitchTracker_storageModule.storage.streamerList = streamerList;
		buildStreamerList();
	}
);

attachClickListeners();
buildStreamerList();
gatherStreamStatuses();
TwitchTracker_timingModule.setInterval(gatherStreamStatuses, 5000);