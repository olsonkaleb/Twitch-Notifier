window.addEventListener('click', function (event) 
	{
		if(event.button == 0 && event.shiftKey == false)
			self.port.emit("openStreamList");
		
		event.preventDefault();
	}, true
);
	
self.port.on("changeLiveCount", function changeLiveCount(countChange)
	{
		if (countChange == -1)
		{
			document.getElementById("liveStreamCount").style.color = "#444444";
			document.getElementById("liveStreamCount").textContent = "X";
		}
		if (countChange == 0)
		{
			document.getElementById("liveStreamCount").style.color = "#C71A3F";
			document.getElementById("liveStreamCount").textContent = "0";
		}
		else if (countChange == 1)
		{
			document.getElementById("liveStreamCount").style.color = "#208F15";
			document.getElementById("liveStreamCount").textContent = parseInt(document.getElementById("liveStreamCount").textContent) + 1;
		}
	}
);