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
	
	var numOfDevice = 1;			// 웹페이지에서 확인할 디바이스의 갯수 (config.js의 갯수)
	var nodeIndex=0;				// 현재 출력되는 (config-1) 정보 ex) nodeIndex =0 -> config_1 정보	
	var container_name = 'LoRa';	// 생성한 container의 이름 (config.js 수정)
	var tv = 1000;	// Interval 주기

	var nodeID = [];				// LTID 정보 저장
	var delimiter = [];				// 디바이스에서 전달되는 <con> 데이터의 구분자 (config.js 수정)

	var map = null;					// 지도 정보
	var valueLat = "0";				// 지도에 표시될 디바이스의 위도 Tmp
	var valueLng = "0";				// 지도에 표시될 디바이스의 경도 Tmp
	
	var result_lat = [];	// 지도에 표시될 디바이스의 위도 보관
	var result_lng = [];	// 지도에 표시될 디바이스의 경도 보관

	var emailOptions = {			// 알림 메시지를 받을 이메일 정보
		from: 'ThingPlug <skt.thingplug@gmail.com>',
		to: 'mailto@sdddk.com',
		subject: 'ThingPlug Alert',
		text: 'test for image',

	};
		
	var distance_threshold = 50;	//거리 기준값
	var temp_threshold = 33;		//온도 기준값
	var bright_threshold = 200; //150;		//밝기 기준값
	
	var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );
	var graph_temp = createGraph('temp'); 
	var graph_dist = createGraph('dist'); 
	var graph_light = createGraph('light'); 
	// Init NodeID from config
	getConfig( function(err,config) {
		$('#NodeID')[0].innerText = config.nodeID;
	});

// To-Do : 
function applyRule() {
}

function createGraph(key) {
	var graph = new Rickshaw.Graph( {
		element: $('#chart_'+key)[0],
		width: $('#chart_'+key)[0].clientWidth,
		height: $('#chart_'+key)[0].clientHeight,
		renderer: 'line',
		series: new Rickshaw.Series.FixedDuration([{ name: key }], undefined, {
			color : palette.color(),
			timeInterval: tv,
			maxDataPoints: 100,
			timeBase: new Date().getTime() / 1000
		}) 
	});
	graph.render();
	var xAxis = new Rickshaw.Graph.Axis.Time({
		graph:graph
	});
	var yAxis = new Rickshaw.Graph.Axis.Y({
	    graph: graph,
	    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
	});
	var hoverDetail = new Rickshaw.Graph.HoverDetail( {
	    graph: graph
	});
	return graph;
}

function initRickShaw() {

	var iv = setInterval( function() {
		getData(container_name, function(err,time,data_prim, gwl, geui){
			//Distance, Bright, Temp 확인
			//console.log('Recv raw data :' + data_prim);
			
			var valueLux = data_prim.substring(46,50);
			valueLux = parseInt(valueLux, 16);

			var valueTemp = data_prim.substring(24,28);
			valueTemp = parseInt(valueTemp, 16);
			valueTemp = Math.round(valueTemp/100);

			var valueHumid = data_prim.substring(40,42); //lesmin battery = Gyro Z
			valueHumid = parseInt(valueHumid, 16);
			
			var valueDistance = data_prim.substring(32,36);//어느부분인지 확인해야함
			valueDistance = parseInt(valueDistance, 16);
			
			// update render
			var data_temp = { temp: valueTemp };
			graph_temp.series.addData(data_temp);
			graph_temp.update();
			var data_dist = { dist: valueDistance };
			graph_dist.series.addData(data_dist);
			graph_dist.update();
			var data_light = { light: valueLux };
			graph_light.series.addData(data_light);
			graph_light.update();
			// update Text
			$('#temp_value')[0].innerText = valueTemp;
			$('#distance_value')[0].innerText = valueDistance;
			$('#lux_value')[0].innerText = valueLux;

			// Insert Node ID and show Image
			// update Photo URL
			getPhoto(function(err, img_addr){
				//console.log("Image Path :" +img_addr);
				$("#data_img")[0].src = "/"+img_addr;
			});

			///////////////////////////////////////////////////////////////////////////
			// Rule Engine
			if(valueDistance < distance_threshold ){
				if(!DISTANCE_FLAG){
					$.post('/control', {cmt:'TakePhoto',cmd:'request'}, function(data,status){
						toastr.warning('Take Photo');
					});
					DISTANCE_FLAG = true;	
				}
			}
			else{
				DISTANCE_FLAG = false;
			}
		
			
			if(valueLux < bright_threshold){
				if(!LED_GREEN){
					$.post('/control', {cmt:'LEDControl',cmd:'G1'}, function(data,status){
						toastr.success('Turn On Lights');
					});
					LED_GREEN = true;
				}
			}
			else {
				if(LED_GREEN){
					$.post('/control', {cmt:'LEDControl',cmd:'G0'}, function(data,status){
						toastr.success('Turn Off Lights');
					});
					LED_GREEN = false;
				}
			}
			
			if(valueTemp > temp_threshold){
				if(!LED_RED){
					$.post('/control', {cmt:'LEDControl',cmd:'R1'}, function(data,status){
						toastr.error('Emergency');
					});
					LED_RED = true;
				}	
			}
			else {
				if(LED_RED){
					$.post('/control', {cmt:'LEDControl',cmd:'R0'}, function(data,status){
						toastr.error('Emergency');
					});
					LED_RED = false;
				}	
			}
			// End of Rule Engine
			///////////////////////////////////////////////////////////////////////////
		});
	}, tv );
}
initRickShaw();

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
	
	

//=============================================================================================================================//
function getPhoto(cb) {
		var url = '/image';
		
		$.get(url, function(data, status){
			if(status == 'success'){		
				var img_addr = data.con;
				//console.log("getPhoto():img_addr="+img_addr); //lesmin
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
		if(err) return console.error(err);
		else container_name = config.containerName;
	});
	var LED_RED = false;
	var LED_GREEN = false;
	var DISTANCE_FLAG = false;

//=============================================================================================================================//
/*
	var mapInterval = setTimeout(
	function(){
		initMap();
	}, 500);
*/	
//=============================================================================================================================//

//-------------------------------------TakePhoto 버튼 클릭---------------------------------------//

	$('#TakePhoto').on('click', function(event) {
			//toastr.warning('Take Photo');
		$.post('/control', {cmt:'TakePhoto', cmd:'request'}, function(data, status){
			toastr.warning('Take Photo Done');
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
