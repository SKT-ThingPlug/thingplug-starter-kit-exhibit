/**
 * @file oneM2M.c
 *
 * @brief oneM2M API
 *
 * Copyright (C) 2016. SK Telecom, All Rights Reserved.
 * Written 2016, by SK Telecom
 */
#include <stdio.h>
#include <stddef.h>

#include "oneM2M.h"
#include "include/MQTT.h"
#include "StreamWrapper.h"


#ifdef __cplusplus
extern "C" {
#endif


/**
 * @brief set callback function
 * @param[in] cc connect callback
 * @param[in] sc subscribe callback
 * @param[in] dc disconnect callback
 * @param[in] clc connection lost callback
 * @param[in] mdc message delivered callback
 * @param[in] mac message arrived callback
 * @return the return code of the set callbacks result
 */
int tpMQTTSetCallbacks(tpMQTTConnectedCallback* cc, tpMQTTSubscribedCallback* sc, tpMQTTDisconnectedCallback* dc, 
        tpMQTTConnectionLostCallback* clc, tpMQTTMessageDeliveredCallback* mdc, tpMQTTMessageArrivedCallback* mac) {
    int rc = MQTTSetCallbacks(cc, sc, dc, clc, mdc, mac);
    Stream_print_str(NULL,"tpMQTTSetCallbacks\n");
    return rc;
}

#ifdef ONEM2M_LINUX
/**
 * @brief create mqtt
 * @param[in] host the hostname or ip address of the broker to connect to.
 * @param[in] port the network port to connect to.  Usually 1883.
 * @param[in] keepalive the number of seconds after which the broker should send a PING message to the client if no other messages have been exchanged in that time. 
 * @param[in] userName authentication user name
 * @param[in] password authentication password
 * @param[in] enableServerCertAuth True/False option to enable verification of the server certificate
 * @param[in] subscribeTopic mqtt topic
 * @param[in] subscribeTopicSize mqtt topic size
 * @param[in] publishTopic publish topic
 * @return the return code of the connection response
 */
int tpSDKCreate(char* host, int port, int keepalive, char* userName, char* password,
        int enableServerCertAuth, char* subscribeTopic[], int subscribeTopicSize, char* publishTopic) {
    int rc = MQTTAsyncCreate(host, port, keepalive, userName, password, enableServerCertAuth, 
        subscribeTopic, subscribeTopicSize, publishTopic, NULL, 1, "");
    return rc;
}
#elif defined (ONEM2M_ARDUINO)
int tpSDKCreate(char* host, int port, int keepalive, char* userName, char* password,
        int enableServerCertAuth, char* subscribeTopic[], int subscribeTopicSize, char* publishTopic) {
    int rc = MQTTCreate(host, port, keepalive, userName, password, enableServerCertAuth, 
        subscribeTopic, subscribeTopicSize, publishTopic, NULL, 1, NULL);
    return rc;
}
#endif

/**
 * @brief is connected
 * @return true : connected <-> false
 */
int tpMQTTIsConnected() {
    int rc = MQTTIsConnected();
    return rc;
}

/**
 * @brief disconnect mqtt
 */
int tpMQTTDisconnect() {
    int rc = MQTTDisconnect();
    return rc;
}

/**
 * @brief destroy
 */
void tpSDKDestory() {
    MQTTDestroy();
}

#ifdef ONEM2M_ARDUINO
int tpSDKYield(unsigned long timeout_ms)
{
	MQTTyield(timeout_ms);
    return 0;
}
#endif
 
#ifdef __cplusplus
}
#endif