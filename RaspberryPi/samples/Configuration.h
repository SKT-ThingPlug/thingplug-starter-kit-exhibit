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

//#define MQTT_HOST                           "onem2m.sktiot.com"
#define MQTT_HOST                           "mqtt.sktiot.com" // Demoday
#define MQTT_PORT                           1883
#define MQTT_SECURE_PORT                    8883
#define MQTT_KEEP_ALIVE                     120
#define MQTT_ENABLE_SERVER_CERT_AUTH        0

#define ACCOUNT_USER                        ""
#define ACCOUNT_PASSWORD                    ""
#define ONEM2M_CSEBASE                      "ThingPlug"

#define ONEM2M_NODEID                       "" // ex : 1.2.481.1.999.203.000100
//#define ONEM2M_TO                           "/ThingPlug" // onem2m.sktiot.com
#define ONEM2M_TO                           "/ThingPlug/v1_0" // mqtt.sktiot.com
#define ONEM2M_PASSCODE                     "123456" // ex : 123456
#define ONEM2M_RI                           "12345"

#endif // _CONFIGURATION_H_
