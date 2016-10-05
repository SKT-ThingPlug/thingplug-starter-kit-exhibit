/*
 ThingPlug StarterKit for LoRa version 0.1
 
 Copyright © 2016 IoT Tech. Lab of SK Telecom All rights reserved.

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	http://www.apache.org/licenses/LICENSE-2.0
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.

*/

"use strict";

jQuery(document).ready(function() {
	var data = [0];					// 디바이스의 Raw Data 확인	
	var data_humid = [0];			// 웹페이지에 출력되는 습도값
	var data_temp = [0];			// 웹페이지에 출력되는 온도값
	var data_lux = [0];				// 웹페이지에 출력되는 조도값
	var Data_Firm = [0];			// 웹페이지에 출력되는 가상의 Firmware Version
	var Data_NodeID = [0];			// 웹페이지에 출력되는 LTID
	
	var data_img = [0];
	
	var numOfDevice = 1;			// 웹페이지에서 확인할 디바이스의 갯수 (config.js의 갯수)
	var nodeIndex=0;				// 현재 출력되는 (config-1) 정보 ex) nodeIndex =0 -> config_1 정보	
	var period = 1;					// getLatestData 주기 sec (RepPerChange 명령에 의해 변경)
	var container_name = 'LoRa';	// 생성한 container의 이름 (config.js 수정)

	var Firm_Ver = [];				// 가상의 Firmware Version 정보 저장
	var nodeID = [];				// LTID 정보 저장
	var delimiter = [];				// 디바이스에서 전달되는 <con> 데이터의 구분자 (config.js 수정)

	var MAX_DATA = 30;				// 그래프에 표시되는 데이터의 갯수			
	var map = null;					// 지도 정보
	
	var valueLat = "0";				// 지도에 표시될 디바이스의 위도 Tmp
	var valueLng = "0";				// 지도에 표시될 디바이스의 경도 Tmp
	
	var result_lat = new Array();	// 지도에 표시될 디바이스의 위도 보관
	var result_lng = new Array();	// 지도에 표시될 디바이스의 경도 보관

	var valueIF = null;				// 트리거 상태 값 (트리거로 등록한 센서의 현재 값)
	var trigger_sensor = null;		// 트리거로 등록한 센서 종류(온도, 습도, 조도)
	var trigger_if = null;			// 트리거 옵션(이상|이하|같음)
	var trigger_value = null;		// 트리거 기준 값 (ex : 센서의 value값 이상|이하|같음 인 경우 메시지 전송)
	var trigger_way = null;			// 알림방식 (E-MAIL만 지원)
	var trigger_nodeID = null;		// 알림받을 LTID
	var output_string = "test for image";		// 알림메시지
	
	var emailOptions = {			// 알림 메시지를 받을 이메일 정보
		from: 'ThingPlug <skt.thingplug@gmail.com>',
		to: 'tototo',
		subject: 'ThingPlug Alert',
		//text: 'Temp : ' + data_temp[0].toString() + ', Humidity : ' + data_humid[0].toString() + ', Brightness : ' + data_lux[0].toString(),
		text: 'test for image',
		html: 'Embedded image: <img src="skt.thingplug@gmail.com"/>',
		attachments: [{
			filename: '20160928053309.jpg',
			path: '/test',
			cid: 'skt.thingplug@gmail.com' //same cid value as in the html img src
		}]

	};
	
	
	// var img_address1 = "https://raw.githubusercontent.com/SKT-ThingPlug/thingplug-lora-starter-kit/master/media/image";
	// var img_address2 = 1;
	// var img_address3 = ".png";
	
	var data_distance = 190;			//거리 기준값
	var tmp_img = "";				//이미지 임시값
	var img_address = "capture/";
	
//----------------------------------------- graph Related Variables---------------------------------------//

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
//=============================================================================================================================//

//--------------------------------nodeID 및 Firmware Version 초기화---------------------------------------------------------------//
	function getConfig(cb) {
		var url = '/config_'+(nodeIndex+1).toString();
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
				delimiter.push(config.delimiter);
			});
		}
		nodeIndex=0;
	}
	callnodeID();
//=============================================================================================================================//

//-----------------------------------------------------Event 발생시 알림-------------------------------------------------------//

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
//=============================================================================================================================//


//-----------------------------------------------------지도 초기화 및 표시-------------------------------------------------------//

	function initMap() {
		var myLatLng = [];
		
		for (var i =0; i < numOfDevice; i++) {
			
			if(result_lat[i] == "undefined" || result_lat[i] == null)
				myLatLng.push({lat: 37.566501, lng: 126.985047 + (0.02*i)});
			else
				myLatLng.push({lat: parseFloat(result_lat[i]), lng: parseFloat(result_lng[i])});
		}
		

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
		///////////////////////////////////////////
		var infowindow = [];  
		for (var i =0; i < numOfDevice; i++) {
			infowindow.push(new google.maps.InfoWindow({
				content: contentString(nodeID[i])
			})  );
		}  
		///////////////////////////////////////////
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
		///////////////////////////////////////////
	}
//=============================================================================================================================//

//-----------------------------------------------------그래프 초기화 및 생성-------------------------------------------------------//

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
	
	creategraph(temp_obj);
	creategraph(humid_obj);
	creategraph(lux_obj);
//=============================================================================================================================//

//-----------------------------------------------------container로부터 받은 데이터 처리-------------------------------------------------------//

	function getData(container, cb) {
		var url = '/data/' + container;
		
		$.get(url, function(data, status){
			if(status == 'success'){
				var valuePrim = data.con;
				var valueTime = data.ct;
				
				var valueDate = valueTime.substr(0, 10);
				var valueTimes = valueTime.substr(11, 8);
				valueTime = valueDate + " " + valueTimes;
				
				
				var valuegwl = "000";
				var valueGEUI = "undefined";
				if(data.ppt == null){
					valueLat = "undefined";
					valueLng = "undefined";
				}
				else if(data.ppt != null || data.ppt.gwl != null || data.ppt.gwl.split(",")[1] != null){
					valuegwl = data.ppt.gwl;
					valueGEUI = data.ppt.geui;
				
					result = valuegwl.split(",");
					
					valueLat = result[0];
					valueLng = result[1];
					valueAlt = result[2];
				}
				
				result_lat[nodeIndex] = deepCopy(valueLat);
				result_lng[nodeIndex] = deepCopy(valueLng);
				
				
				cb(null, valueTime, valuePrim, valuegwl, valueGEUI);
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
//=============================================================================================================================//
function getPhoto(cb) {
		var url = '/image';
		
		$.get(url, function(data, status){
			if(status == 'success'){		
				var img_addr = data.con;
				cb(null, img_addr);
			}
			else {
				console.log('[Error] /data API return status :'+status);
				cb({error: status}, null);
			}
		});
	}
//-----------------------------------------------------mgmtCmd 버튼 클릭시 팝업-------------------------------------------------------//

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
//=============================================================================================================================//

//-------------------------------------주기적으로 조회된 최신 데이터 처리---------------------------------------//
		
	getConfig( function(err,config) {
		if(data){ 
			container_name = config.containerName;
		}
	});

	setInterval(function(){
		getPhoto(function(err, img_addr){
			tmp_img = img_addr;
		});
		
		//alert(img_address);
		getData(container_name, function(err,time,data_prim, gwl, geui){
			
			
			
			var valueLux = data_prim.substring(38,42); //data_prim.split(delimiter[nodeIndex])[2];
			//console.log('[Error] lux substring:' + valueLux); //lesmin
			valueLux = parseInt(valueLux, 16);
			//console.log('[Error] lux Hex-to-Dec:' + valueLux); //lesmin
			//valueLux = Math.round(valueLux);
			//valueLux = Math.round((1050 - valueLux)/2);

			var valueTemp = data_prim.substring(30,34); //data_prim.split(delimiter[nodeIndex])[0];
			//console.log('[Error] temp substring:' + valueTemp); //lesmin
			valueTemp = parseInt(valueTemp, 16);
			//console.log('[Error] temp Hex-to-Dec:' + valueTemp); //lesmin
			valueTemp = Math.round(valueTemp/100);
			//console.log('[Error] temp toFloat:' + valueTemp); //lesmin


			//var valueHumid = data_prim.substring(46,48); //data_prim.split(delimiter[nodeIndex])[1];
			var valueHumid = data_prim.substring(4,6); //lesmin battery = Gyro Z
			//console.log('[Error] Humid substring:' + valueHumid); //lesmin
			valueHumid = parseInt(valueHumid, 16);
			//console.log('[Error] Humid Hex-to-Dec:' + valueHumid); //lesmin
			//valueHumid = valueHumid -30; //2.54;			
				
			
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////Distance 확인///////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			
			var valueDistance = data_prim.substring(53,56);//어느부분인지 확인해야함
			valueDistance = parseInt(valueDistance, 16);
			//alert(valueDistance);
			if(valueDistance < data_distance && tmp_img != img_address){
				img_address = tmp_img;
				$.post('/control', {cmt:'TakePhoto',cmd:'request'}, function(data,status){
					toastr.warning('Take Photo');
				});
			}
						
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////
			
			// var valueTemp = data_prim.split(delimiter[nodeIndex])[0];
			// var valueHumid = data_prim.split(delimiter[nodeIndex])[1];
			// var valueLux = data_prim.split(delimiter[nodeIndex])[2];
			
			insertData(data_temp,valueTemp, '#temp_value');
			insertData(data_humid,valueHumid, '#humid_value');
			insertData(data_lux,valueLux, '#lux_value');
			
			output_string = 'Device ID : '+nodeID[nodeIndex]+', Temp : ' + valueTemp.toString() + ', Humidity : ' + valueHumid.toString() + ', Brightness : ' + valueLux.toString();
			if(trigger_sensor == "Temperature"){//Temperature
				valueIF = parseInt(valueTemp);
			}
			else if(trigger_sensor == "Humidity"){//Humidity
				valueIF = parseInt(valueHumid);
			}
			else if(trigger_sensor == "Bright"){//Bright
				valueIF = parseInt(valueLux);
			}
			

		});
		
		insertData(Data_Firm,Firm_Ver[nodeIndex], '#FirmVer_value');
		insertData(Data_NodeID,nodeID[nodeIndex], '#NodeID');
		
		//document.getElementById("data_img").src = img_address;
		//$("#data_img").attr("src", "file://"+tmp_img);
		//alert(tmp_img);
		
		//var img = fr.readAsDataURL("C:\Users\1110768\OneDrive\문서\스타터킷\소스코드\thingplug-starter-kit_image\capture\20160928053309.jpg");
		//document.getElementById("data_img").src = "file:\/\/C:\/test.jpg";
		document.getElementById("data_img").src = "http://localhost:8080/"+tmp_img;
		//document.getElementById("data_img").src = "http://localhost:8080/"+img_address;
		
		
		updategraph(temp_obj);
		updategraph(humid_obj);
		updategraph(lux_obj);

//=============================================================================================================================//

//-------------------------------------Trigger 설정한 경우 처리---------------------------------------//

		
		var isTrue = false;
		if(trigger_nodeID == Data_NodeID[0]){
			if((trigger_if == 1) && (valueIF < trigger_value) && valueIF){
				isTrue = true;
			}
			else if(trigger_if == 2 && valueIF == trigger_value){
				isTrue = true;

			}
			else if(trigger_if == 3 && valueIF > trigger_value){
				isTrue = true;;
			}
			if(isTrue && trigger_way == "PHONE"){
				smsOptions.CONTENT = output_string;
				sendsms( function(err,smsOptions) {
					alert('Sent SMS : ' + output_string);
				});
				trigger_if = 0;
			}
			else if(isTrue && trigger_way == "E-Mail"){
				emailOptions.text = output_string;
				sendmail( function(err,emailOptions) {
					alert('Sent E-MAIL : '+ output_string);
				});
				trigger_if = 0;
			}
		}

		
	}, period*1000);

//=============================================================================================================================//

	var mapInterval = setTimeout(
	function(){
		initMap();
	}, 500);

				// sendmail( function(err,emailOptions) {
					// alert('Sent E-MAIL');
				// });
//=============================================================================================================================//

//-------------------------------------RepImmediate 버튼 클릭---------------------------------------//

	$('#TakePhoto').on('click', function(event) {
		$.post('/control', {cmt:'TakePhoto',cmd:'request'}, function(data,status){
			toastr.warning('Take Photo');
		});
	});
//=============================================================================================================================//

//-------------------------------------extDevMgmt 버튼 클릭---------------------------------------//

	$('#extDevMgmt').on('click', function(event) {
		var reqcmd = document.getElementById('command_value').value;
		$.post('/control', {cmt:'extDevMgmt',cmd: reqcmd}, function(data,status){
			toastr.info('Your own mgmtCmd : "' + reqcmd + '"');
		});
	});
//=============================================================================================================================//

//=============================================================================================================================//
function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}
});
