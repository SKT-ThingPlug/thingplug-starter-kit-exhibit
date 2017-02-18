/**
 * @file Configuration.h
 *
 * @brief Configuration header for The Samples
 *
 * Copyright (C) 2016. SK Telecom, All Rights Reserved.
 * Written 2016, by SK Telecom
 */

#ifndef _CONFIGURATION_H_
#define _CONFIGURATION_H_


#define MQTT_HOST                           "thingplugtest.sktiot.com"
#define MQTT_PORT                           1883
#define MQTT_SECURE_PORT                    8883
#define MQTT_KEEP_ALIVE                     300
#define MQTT_ENABLE_SERVER_CERT_AUTH        0

#define ACCOUNT_USER						"(TBD.)"
#define ACCOUNT_PASSWORD					"(TBD.)"

#define ONEM2M_CSEBASE                      "ThingPlug"
#define ONEM2M_NODEID                       "(TBD.)"  // ex : 1.2.481.1.999.000.000000
#define ONEM2M_TO                           "/ThingPlug/v1_0"
#define ONEM2M_PASSCODE                     "(TBD.)" // ex : 123456
#define ONEM2M_RI                           "1234"

#define NAME_CONTAINER                      "%s_container_01"
#define NAME_MGMTCMD                        "%s_%s"
#define NAME_AREANWKINFO                    "%s_areaNwkInfo_01"
#define NAME_LOCATIONPOLICY                 "%s_locationPolicy_01"
#define NAME_AE                             "%s_AE_01"
// common
#define CMT_DEVRESET						"DevReset"
#define CMT_REPPERCHANGE					"RepPerChange"
#define CMT_REPIMMEDIATE					"RepImmediate"
#define CMT_TAKEPHOTO						"TakePhoto"
#define CMT_LEDCONTROL						"LEDControl"

#define TOPIC_PUBLISH                       "/oneM2M/req/%s/%s"

#define ONEM2M_CLIENTID                     "5566" // mac address ends

#endif // _CONFIGURATION_H_

