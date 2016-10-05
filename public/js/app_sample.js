
"use strict";

jQuery(document).ready(function() {
	var data = [0];
	var data_humid = [0];
	var data_temp = [0];
	var data_lux = [0];

	var time = [0];

	var Data_Firm = [0];
	var Data_NodeID_1 = [0];
	var Data_NodeID_2 = [0];


	var Data_NodeID = [0];

	var nodeIndex=0;
	

	var period = 1;
	var Firm_Ver = [];

	var MAX_DATA = 30;
	
	var recent_ri = 0;
	var container_name = 'myContainer';

	var nodeID = [];  

	var numOfDevice = 2;


	var map = null;
	var valueLat = null;
	var valueLng = null;
	var valueAlt = null;

	var valueIF = null;

	var emailAddress = null;

	var emailOptions = {
		from: 'ThingPlug <skt.thingplug@gmail.com>',
		to: null,
		subject: 'ThingPlug Alert',
		text: 'Temp : ' + data_temp[0].toString() + ', Humidity : ' + data_humid[0].toString() + ', Brightness : ' + data_lux[0].toString()
	};
	
	var smsOptions = {
		CONTENT : null,
		RECEIVERS : null
	};

	
	var if_sensor = null;
	var if_if = null;
	var if_value = null;
	var if_way = null;
	var if_nodeID = null;
	var output_string = null;
	
	/* graph Related Variables */
	var color_temp = d3.scale.category10();
	color_temp.domain(['Sensor_temp']);
	var temp_obj = {
		id : 'temp',
		_color : color_temp,
		_series : color_temp.domain().map(function(name){
			return {
				name : 'Sensor_temp',
				values : data_temp
			};
		}),
		_x : null,
		_y : null,
		_line : null,
		_graph : null,
		_xAxis : null,
		_yAxis : null,
		_ld : null,
		_path : null,
		
		width : document.getElementById("graph_temp").clientWidth,
		height : document.getElementById("graph_temp").clientHeight

	};

	///////////////////////////////////////////////////
	var color_humid = d3.scale.category10();
	color_humid.domain(['Sensor_humid']);
	var humid_obj = {
		id : 'humid',
		_color : color_humid,
		_series : color_humid.domain().map(function(name){
			return {
				name : 'Sensor_humid',
				values : data_humid
			};
		}),
		_x : null,
		_y : null,
		_line : null,
		_graph : null,
		_xAxis : null,
		_yAxis : null,
		_ld : null,
		_path : null,
		width : document.getElementById("graph_humid").clientWidth,
		height : document.getElementById("graph_humid").clientHeight
		
	};
	///////////////////////////////////////////////////
	var color_lux = d3.scale.category10();
	color_lux.domain(['Sensor_lux']);
	var lux_obj = {
		id : 'lux',
		_color : color_lux,
		_series : color_lux.domain().map(function(name){
			return {
				name : 'Sensor_lux',
				values : data_lux
			};
		}),
		_x : null,
		_y : null,
		_line : null,
		_graph : null,
		_xAxis : null,
		_yAxis : null,
		_ld : null,
		_path : null,
		width : document.getElementById("graph_lux").clientWidth,
		height : document.getElementById("graph_lux").clientHeight

		
	};

	/* end of graph Related Variables */
	///////////////////////////////////////////////////  
	


	function hextodec(hex) {
		var final = 0;
		var letters = { a : 10, b : 11, c : 12, d : 13, e : 14, f : 15 };
		var len = hex.length;
		for(var i=0;i<len;i++) {
			var ch = hex.charAt(len-i-1);
			if( ch in letters )
			ch = letters[ch];
			var shiftBy = 4*i; 
			var sub = ch << shiftBy;
			final += sub;
		}
		return final;
	}

	///////////////////////////////////////////

	function getConfig(cb) {
		if(nodeIndex==0)
		var url = '/config_1';
		else if(nodeIndex==1)
		var url = '/config_2';
		$.get(url, function(data, status){
			if(status == 'success'){
				cb(null, data);
			}
			else {
				console.log('[Error] /config API return status :'+status);
				cb({error: status}, null);
			}
		});
	}
	
	
	function callnodeID() {
		for(var i=0;i<numOfDevice;i++) {
			nodeIndex=i;
			getConfig( function(err,config) {
				nodeID.push(config.nodeID);	
				Firm_Ver.push('0.1.0');
				Firm_Ver.push('0.1.0');
			});
		}
		nodeIndex=0;
	}
	callnodeID();
	///////////////////////////////////////////
	function sendmail(cb) {
		var url = '/email';

		$.post(url, emailOptions, function(data,status){
			if(status == 'success'){
				cb(null, emailOptions);
			}
			else {
				console.log('[Error] /config API return status :'+status);
				cb({error: status}, null);
			}
		});
		
	}
	///////////////////////////////////////////
	function sendsms(cb) {
		var url = '/sms';

		$.post(url, smsOptions, function(data,status){
			if(status == 'success'){
				cb(null, smsOptions);
			}
			else {
				console.log('[Error] /config API return status :'+status);
				cb({error: status}, null);
			}
		});
		
	}

	function initMap() {
		var myLatLng = [{lat: 37.44, lng: 127.00},
		{lat: 37.55, lng: 127.11}];
		
		map = new google.maps.Map(document.getElementById('map'), {
			center: myLatLng[0],
			zoom: 10
		});			
		///////////////////////////////////////////
		
		function contentString(content){
			return '<div id="content">'+
			'<div id="siteNotice">'+
			'</div>'+
			'<h4 id="firstHeading" class="firstHeading">LoRa Dev</h4>'+
			'nodeID : '+ content +
			'</div>';
		}

		var infowindow = [];  
		for (var i =0; i < numOfDevice; i++) {
			infowindow.push(new google.maps.InfoWindow({
				content: contentString(nodeID[i])
			})  );
		}  


		var marker = [];  
		for (var i =0; i < numOfDevice; i++) {
			marker.push(new google.maps.Marker({
				position: myLatLng[i],
				map: map,
				title: 'SKT LoRa Device',})
			);	
		}


		///////////////////////////////////////////
		
		for (var j =0; j < numOfDevice; j++) {
			google.maps.event.addListener(marker[j], 'click', InfoListener(j));
		}

		function InfoListener(j){
			return function(){
				nodeIndex=j;
				
				getConfig( function(err,config) {
					nodeID[j] = config.nodeID;
				});
				
				for (var i =0; i < numOfDevice; i++) {	
					if( infowindow[i] ) {
						infowindow[i].close();
					}
				}

				infowindow[j] = new google.maps.InfoWindow({
					content: contentString(nodeID[j])
				});
				infowindow[j].open(map, marker[j]);
			};
		}	

	} 

	function creategraph(obj) {
		obj._color.domain("Sensor_"+obj.id);
		
		
		var width;
		var height;
		

		var margin = {top: 10, right: 30, bottom: 20, left: 10};

		width = obj.width - margin.left - margin.right;
		height = obj.height - margin.top - margin.bottom;

		// create the graph_temp object
		obj._graph = d3.select("#graph_"+obj.id).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		obj._x = d3.scale.linear()
		.domain([0, MAX_DATA])
		.range([width, 0]);
		obj._y = d3.scale.linear()
		.domain([
		d3.min(obj._series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
		d3.max(obj._series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
		])
		.range([height, 0]);
		//add the axes labels
		obj._graph.append("text")
		.attr("class", "axis-label")
		.style("text-anchor", "end")
		.attr("x_"+obj.id, 100)
		.attr("y_"+obj.id, height)



		obj._line = d3.svg.line()
		.x(function(d, i) { return obj._x(i); })
		.y(function(d) { return obj._y(d); });

		obj._xAxis = obj._graph.append("g")
		.attr("class", "x_"+obj.id+" axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.svg.axis().scale(obj._x).orient("bottom"));

		obj._yAxis = obj._graph.append("g")
		.attr("class", "y_"+obj.id+" axis")
		.attr("transform", "translate(" + width + ",0)")
		.call(d3.svg.axis().scale(obj._y).orient("right"));

		obj._ld = obj._graph.selectAll(".series_"+obj.id)
		.data(obj._series)
		.enter().append("g")
		.attr("class", "series_"+obj.id);

		// display the line by appending an svg:path element with the data line we created above
		obj._path = obj._ld.append("path")
		.attr("class", "line")
		.attr("d", function(d) { return obj._line(d.values); })
		.style("stroke", function(d) { return obj._color(d.name); });
		
	}

	function updategraph(obj) {
		// static update without animation
		obj._y.domain([
		d3.min(obj._series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
		d3.max(obj._series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
		]);
		obj._yAxis.call(d3.svg.axis().scale(obj._y).orient("right"));

		obj._path
		.attr("d", function(d) { return obj._line(d.values); })
	}

	function getData(container, cb, timeValue, data_lux) {
		var url = '/data/' + container;
		
		$.get(url, function(data, status){
			if(status == 'success'){
				var valuePrim = data.con;
				var valueTime = data.ct;
				
				var valueDate = valueTime.substr(0, 10);
				var valueTimes = valueTime.substr(11, 8);
				valueTime = valueDate + " " + valueTimes;
				var valueLatHex = valuePrim.substr(16,6); // get Latitude value in Hex manner
				var valueLngHex = valuePrim.substr(22,6); // get Latitude value in Hex manner	
				var valueAltHex = valuePrim.substr(28,4);
				var valueHex = valuePrim.substr(14,1); // get (a,b) means substract b characters from a point
				valueLat = hextodec(valueLatHex)/100000;
				valueLng = hextodec(valueLngHex)/100000;
				valueAlt = hextodec(valueAltHex);
				var value = hextodec(valueHex);
				var ri = parseInt(data.ri.slice(2, data.ri.length));
				if(ri > recent_ri){
					recent_ri = ri;
				}
				cb(null, valueLat, valueLng, valueAlt, valueTime, valuePrim);
			}
			else {
				console.log('[Error] /data API return status :'+status);
				cb({error: status}, null);
			}
		});
	}

	function insertData(dest, value, name){
		if(dest.length == MAX_DATA){
			dest.pop();
		}
		dest.splice(0,0,value);
		$(name)[0].innerText = dest[0];
		
	}  

	function initToastOptions(){
		toastr.options = {
			"closeButton": true,
			"debug": false,
			"newestOnTop": false,
			"progressBar": true,
			"positionClass": "toast-bottom-full-width",
			"preventDuplicates": false,
			"onclick": null,
			"showDuration": "3000",
			"hideDuration": "10000",
			"timeOut": "2000",
			"extendedTimeOut": "1000",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
		}
	}

	initToastOptions();

	creategraph(temp_obj);
	creategraph(humid_obj);
	creategraph(lux_obj);

	initMap();
	setInterval(function(){
		
		getData(container_name, function(err,data,data_lng, data_alt, time,data_prim){
			var valueTemp = data_prim.substr(0,2);
			var valueHumid = data_prim.substr(3,2);
			var valueLux = data_prim.substr(6,2);
			
			insertData(data_temp,valueTemp, '#temp_value');
			insertData(data_humid,valueHumid, '#humid_value');
			insertData(data_lux,valueLux, '#lux_value');
			
			output_string = 'Device ID : '+nodeID[nodeIndex]+', Temp : ' + valueTemp.toString() + ', Humidity : ' + valueHumid.toString() + ', Brightness : ' + valueLux.toString();
			if(if_sensor == "Temperature"){//Temperature
				valueIF = parseInt(valueTemp);
			}
			else if(if_sensor == "Humidity"){//Humidity
				valueIF = parseInt(valueHumid);
			}
			else if(if_sensor == "Bright"){//Bright
				valueIF = parseInt(valueLux);
			}
			

		});
		insertData(Data_Firm,Firm_Ver[nodeIndex], '#FirmVer_value');
		insertData(Data_NodeID,nodeID[nodeIndex], '#NodeID');
		
		updategraph(temp_obj);
		updategraph(humid_obj);
		updategraph(lux_obj);

		
		getConfig( function(err,config) {
			if(data){ 
				container_name = config.containerName;
				
			}
		});
		
		

		
		var isTrue = false;
		if(if_nodeID == Data_NodeID[0]){
			//alert(valueIF + "," + if_value + "," + if_if)
			if((if_if == 1) && (valueIF < if_value) && valueIF){
				isTrue = true;
				
			}
			else if(if_if == 2 && valueIF == if_value){
				isTrue = true;

			}
			else if(if_if == 3 && valueIF > if_value){
				isTrue = true;;
			}
			if(isTrue && if_way == "PHONE"){
				smsOptions.CONTENT = output_string;
				sendsms( function(err,smsOptions) {
					alert('Sent SMS');
				});
				if_if = 0;
			}
			else if(isTrue && if_way == "E-Mail"){
				emailOptions.text = output_string;
				sendmail( function(err,emailOptions) {
					alert(valueIF);
					alert('Sent E-MAIL');
				});
				if_if = 0;
			}
		}

		
	}, period*1000);


	var mapInterval = setTimeout(
	function(){
		initMap();
	}, 500);



	$('#DevReset').on('click', function(event) {
		$.post('/control',{cmt:'DevReset', cmd:'request'}, function(data,status){
			toastr.success('Device Reset');
			console.log(data);
		});
	});
	$('#RepPerChange').on('click', function(event) {
		$.post('/control', {cmt:'RepPerChange', cmd: document.getElementById('input_value').value}, function(data,status){
			toastr.info('Period Changed');
			console.log(data);
			period=document.getElementById('input_value').value;
		});
	});
	$('#RepImmediate').on('click', function(event) {
		$.post('/control', {cmt:'RepImmediate',cmd:'request'}, function(data,status){
			toastr.warning('Ariconditioner ON');
			console.log(data);
			Firm_Ver[nodeIndex] = '1.0.0';
		});
	});

	$('#action_button').on('click', function(event) {

		
		if_sensor = document.getElementById('if_sensor').value;
		if_if = document.getElementById('if_if').value;
		if_value = document.getElementById('if_value').value;
		alert('Registered');
		
		if_way = document.getElementById('if_way').value;
		if_nodeID = nodeID[nodeIndex];
		
		
		var sign_if = null;
		if(if_if == 1){
			sign_if = " < ";
		}
		else if(if_if == 2){
			sign_if = " == ";

		}
		else if(if_if == 3){
			sign_if = " > ";
		}	
		output_string = "Check, when "+if_nodeID+ " is " + if_sensor + sign_if + if_value + ", it will be notified";
		
		if(if_way == "PHONE" && sign_if){
			smsOptions.RECEIVERS = [document.getElementById('action_type_value').value];
			
			
			smsOptions.CONTENT = output_string;
			sendsms( function(err,smsOptions) {
				alert('Sent SMS');
			});
		}
		else if(if_way == "E-Mail" && sign_if){
			emailOptions.text = output_string;
			emailOptions.to = document.getElementById('action_type_value').value;
			sendmail( function(err,emailOptions) {
				alert('Sent E-MAIL');
			});
			
		}
	});

});
