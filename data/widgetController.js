window.addEventListener('click', function(event) 
	{
		if(event.button == 0 && event.shiftKey == false)
			self.port.emit("openStreamList");
		
		event.preventDefault();
	}, true
);
	
self.port.on("setLiveCount", function(liveCount)
	{
		if (liveCount > 0)
			document.getElementById("liveStreamCount").style.color = "#208F15";
		else if (liveCount == 0)
			document.getElementById("liveStreamCount").style.color = "#C71A3F";
		else if (liveCount == -1)
			document.getElementById("liveStreamCount").style.color = "#444444";
		
		if (liveCount != -1)
			document.getElementById("liveStreamCount").innerHTML = liveCount;
		else
			document.getElementById("liveStreamCount").innerHTML = "X";
	}
);