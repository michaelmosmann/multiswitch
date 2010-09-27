/************************************************
 * der zweite Versuch
 ************************************************/
Logger=
{
		ERROR:0,
		INFO:1,
		DEBUG:2,
		
		LEVEL:1,
		
		error: function(message)
		{
			console.error(message);
		},
		
		info: function(message)
		{
			if (this.LEVEL>=this.INFO) console.log("INFO: "+message);
		},
		
		debug: function(message)
		{
			if (this.LEVEL>=this.DEBUG) console.log("DEBUG: "+message);
		},
}

Array.remove=function(list, matcher)
{
	for (var i = 0; i < list.length; i++)
	{
		inList=list[i];
		if (matcher(inList))
		{
			start=list.slice(0,i);
			end=list.slice(i+1,0);
			return start.concat(end);
		}
	}
	return list;
}

Array.get=function(list, matcher)
{
	for (var i = 0; i < list.length; i++)
	{
		inList=list[i];
		if (matcher(inList))
		{
			return inList;
		}
	}
	return null;
}

MultiSwitch =
{
	
}

MultiSwitch.Hosts =
{
		Types: function()
		{
			return [{id: 'DEV', name:'Development'},{id: 'TEST', name:'Test'},{id: 'PROD', name:'Production'}];
		},
		
		TypeName: function(typeId)
		{
			var types=this.Types();
			for (var i=0;i<types.length;i++)
			{
				if (types[i].id==typeId) return types[i].name;
			}
			return null;
		}
};

Id =
{
	counter:0,
	nextId: function()
	{
		this.counter=this.counter+1;
		return this.counter;
	}
}

function Host()
{
	this._id=Id.nextId();
	this.name="";
	this.prefix="";
	this.fromJSON=function(json)
	{
		this._id=json.id;
//		if (this._id==null) this._id=Id.nextId();
		this.prefix=json.prefix;
		this.type=json.type;
		this.name=json.name ? json.name : "";
	};
	this.toJSON=function()
	{
		return {id: this._id, prefix: this.prefix, type: this.type, name:this.name};
	};
	this.id=function()
	{
//		console.log("getId(): "+this._id);
		return this._id;
	}
}

function App() 
{
	this._id=Id.nextId();
	
	this.fromJSON=function(id,json)
	{
		if (json['type']=='App')
		{
			this._id=id;
			this.name=json['name'];
//			this._hosts=json['hosts'];
			var hostList=json['hosts'];
			this._hosts=[];
			for (var i=0;i<hostList.length;i++)
			{
				var host=new Host();
				host.fromJSON(hostList[i]);
				this._hosts.push(host);
			}
			
			return true;
		}
		return false;
	};
	
	this.toJSON=function()
	{
		var hostList=[];
		for (var i=0;i<this._hosts.length;i++)
		{
			hostList.push(this._hosts[i].toJSON());
		}
		return {type: 'App', name: this.name, hosts: hostList };
	};
	
	this._hosts=[];
	
	this.id=function()
	{
		return this._id;
	}
	this.addHost=function(host)
	{
		this._hosts.push(host);
	}
	this.removeHost=function(host)
	{
		this._hosts=Array.remove(this._hosts, function(item) { return item==host; });
	}
	this.getHost=function(id)
	{
		return Array.get(this._hosts, function(item) { return item.id()==id; });
	}
	this.getNextHost=function(currentHostId)
	{
		var lastHost = null;
		var max = this._hosts.length;
		for(var i = 0; i<max;i++){
			var host = this._hosts[i];
			if(host.id()==currentHostId){
				if(i+1<max){
					return this._hosts[i+1];
				}else{
					return this._hosts[0];
				}
			}
		}
	}
	this.hosts=function()
	{
		return this._hosts;
	}
	this.update=function()
	{
		Logger.debug("update: "+this.id()+" -> "+this.name);
		MultiSwitch.Store.set(this.id(),this.toJSON());
	};
	this.remove=function()
	{
		Logger.debug("delete: "+this.id()+" -> "+this.name);
		MultiSwitch.Store.set(this.id(),null);
	};
}

MultiSwitch.Store = 
{
	get: function(key)
	{
		var val=localStorage[key];
		if (!val) return;
		try
		{
			return JSON.parse(val);
		}
		catch (ex)
		{
			console.error("Key="+key+": "+ex);
		}
	},

	set: function(key,value)
	{
		if (value) localStorage[key]=JSON.stringify(value);
		else localStorage.removeItem(key);
	}
}

MultiSwitch.Apps = 
{
	list: function()
	{
//		killlX();
		var ret=[];
		
		Logger.debug("list Apps: "+localStorage.length);
		for (var i=0;i<localStorage.length;i++)
		{
			var key=localStorage.key(i);
//			console.log("Key: "+key);
			var app=this.get(key);
			if (app!=null) ret.push(app);
		}
		
		return ret;
	},
	
	get: function(id)
	{
		var value=MultiSwitch.Store.get(id);
		if (value)
		{
			Logger.debug("Key: "+id+" Value:"+JSON.stringify(value));
			var app=new App();
			if (app.fromJSON(id,value))
			{
				return app;
			}
			else
			{
				Logger.debug("Skip: "+id);
			}
		}
		return null;
	}

}

MultiSwitch.Options = function(){
	
	var options = null;
	
	function get(key){
		if(options==null){
			init();
		}
		return options[key];
	};
	
	function set(key,value){
		if(options==null){
			init();
		}
		options[key] = value;
		MultiSwitch.Store.set("options",options);
	}
	
	function init(){
		options = MultiSwitch.Store.get("options");
		if(options==null){
			//create default options
			options =  MultiSwitch.Store.set("options",{
				changeByClick:false
			});
			options = MultiSwitch.Store.get("options");
		}
	};
	
	return {
		get: get,
		set: set
	}
}();

function getHostForId(id){
	bg = chrome.extension.getBackgroundPage();
	currentApp = bg.currentApp;
	if(currentApp!=null){
		if(currentApp.hosts()!=null){
			var hosts = currentApp.hosts();
			for(var i = 0; i < hosts.length; i++){
				if(hosts[i].id() == id){
					return hosts[i];
				}
			}
		}
	}
	return null;
}

function getHostForUrl(url){
	var returnHost = null;
	bg = chrome.extension.getBackgroundPage();
	currentApp = bg.currentApp;
	if(currentApp!=null){
		if(currentApp.hosts()!=null){
			var hosts = currentApp.hosts();
			if(hosts!=null){
				for(var i = 0; i < hosts.length; i++){
					var host = hosts[i];
					var hostRegexp = new RegExp(host.prefix+"(\\/.*)?$");
					if(hostRegexp.test(url)){
						returnHost = host;
						break;
					}
				}
			}
		}
	}
	return returnHost;
}

function switchHost(id, createNewTab,background){
   	if(createNewTab==null){
        createNewTab = false;
    }
    if(background==null){
        background = false;
    }
    var selected = !background;
	var host = getHostForId(id);
	
    chrome.tabs.getSelected(null, function(tab) {
			var currentUrl = tab.url;
			var currentHost = getHostForUrl(currentUrl);
			if(currentHost!=null){
				var newUrl = currentUrl.replace(currentHost.prefix,host.prefix);
				currentHost = host;
				if(!createNewTab){
					chrome.tabs.update(tab.id, {url:newUrl});
				}else{
					chrome.tabs.create({url:newUrl,'selected':selected});
				}

			}
    });
    return host;
  }