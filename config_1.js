// /*
 // ThingPlug StarterKit for LoRa version 0.1
 
 // Copyright © 2016 IoT Tech. Lab of SK Telecom All rights reserved.

	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	// http://www.apache.org/licenses/LICENSE-2.0
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.

// */

module.exports = {
  AppEUI : 'ThingPlug',                   		// Application EUI
  version : 'v1_0',                             	// Application의 version
  DevEUI : 'DevEUI',								// Device EUI
  
  TPhost : 'thingplugtest.sktiot.com',      		// ThingPlug의 HOST Addresss
  TPport : '9000',                             		// ThingPlug의 HTTP PORT 번호


  responseAddress : 'HTTP|http://1.225.1.208:1357',	// HTTP버전에서 디바이스 제어를 위한 디바이스의 물리적 주소 mga
  responsePORT : '1357',                        	// HTTP버전에서 디바이스제어를 위한 디바이스의 물리적 주소의 로컬 포트


  userID : 'kjh15011',                          	// MQTT버전에서 Broker 접속을 위한 ID, 포털 ID 사용
  mqttClientId : 'MQTT Client ID1',    				// MQTT버전에서 Broker 접속을 위한 client ID


  nodeID : '1.2.481.1.999.198.000100',         		// Device 구분을 위한 LTID, 디바이스 고유 ID 사용
  RaspID : '1.2.481.1.999.203.000100',
  passCode : '1234',                          		// ThingPlug에 Device등록 시 사용할 Device의 비밀번호
  uKey : '',                	
//													Thingplug로그인 후, `마이페이지`에 있는 사용자 인증키
  containerName:'1.2.481.1.999.198.000100_container_01',                     // starter kit에서 생성하고 사용할 container 이름 (임의지정)
  DevReset : 'DevReset',                        	// starter kit에서 생성하고 사용할 제어 명령 DevReset
  RepPerChange : 'RepPerChange',                	// starter kit에서 생성하고 사용할 제어 명령 RepPerChange
  RepImmediate : 'RepImmediate',                	// starter kit에서 생성하고 사용할 제어 명령 RepImmediate
  extDevMgmt : 'extDevMgmt',						// starter kit에서 생성하고 사용할 제어 명령 extDevMgmt
  
  UPDATE_CONTENT_INTERVAL : 1000,					//contentInstance 생성주기
  
  BASE_TEMP : 30,
  BASE_HUMID : 60,
  BASE_LUX : 80,
 
  delimiter : ',',									// contents 구분자															
 
  contents : function(){															// Device에서 ThingPlug로 전달하는 실제 데이터 (contentInstance의 Attribute <con>)
	var value_TEMP = (Math.floor(Math.random() * 5) + this.BASE_TEMP).toString();	// 가상의 온도값
	var value_HUMID = (Math.floor(Math.random() * 5) + this.BASE_HUMID).toString();	// 가상의 습도값
	var value_LUX = (Math.floor(Math.random() * 5) + this.BASE_LUX).toString();		// 가상의 조도값

	return value_TEMP + this.delimiter + value_HUMID + this.delimiter + value_LUX;
  }
};