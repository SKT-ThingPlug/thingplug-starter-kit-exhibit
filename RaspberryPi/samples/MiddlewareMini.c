/**
 * @file SimpleSDKVerification.c
 *
 * @brief Simple SDK verification application
 *
 * Copyright (C) 2016. SK Telecom, All Rights Reserved.
 * Written 2016, by SK Telecom
 */
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <unistd.h>

#include "oneM2M.h"
#include "oneM2M_V1.h"
#include "Configuration.h"
#include "SKTtpDebug.h"

#define TO_REMOTECSE                        "%s/remoteCSE-%s"
#define TO_NODE                             "%s/node-%s"
#define TO_CONTAINER                        "%s/remoteCSE-%s/container-%s"
#define TO_CONTENTINSTANCE                  "%s/remoteCSE-%s/container-%s/contentInstance-%s"
#define TO_MGMTCMD                          "%s/mgmtCmd-%s"
#define TO_MGMTCMDRESULT                    "%s/mgmtCmd-%s_%s/execInstance-%s"

#define TOPIC_SUBSCRIBE_REQ                 "/oneM2M/req/+/%s"
#define TOPIC_SUBSCRIBE_RES                 "/oneM2M/resp/%s/+"
#define TOPIC_SUBSCRIBE_SIZE                2
#define TOPIC_PUBLISH                       "/oneM2M/req/%s/%s"

#define NAME_CONTAINER                      "%s_photoURL"
#define NAME_MGMTCMD                        "%s_TakePhoto"
#define NAME_POA                            "MQTT|%s"

#define SUCCESS                            0
#define FAIL                              -1
#define TAKEPHOTO_CMD						"TakePhoto"

enum VERIFICATION_STEP
{
    VERIFICATION_CSEBASE_RETRIEVE = 0,
    VERIFICATION_NODE_CREATE,
    VERIFICATION_REMOTECSE_CREATE,
    VERIFICATION_CONTAINER_CREATE,
    VERIFICATION_MGMTCMD_CREATE,
    VERIFICATION_CONTENTINSTANCE_CREATE,
    VERIFICATION_LOCATIONPOLICY_CREATE,
    VERIFICATION_AE_CREATE,
    VERIFICATION_AREANWKINFO_CREATE,

    VERIFICATION_AREANWKINFO_UPDATE = 9,
    VERIFICATION_AE_UPDATE,
    VERIFICATION_LOCATIONPOLICY_UPDATE,
    VERIFICATION_MGMTCMD_UPDATE,
    VERIFICATION_CONTAINER_UPDATE,
    VERIFICATION_REMOTECSE_UPDATE,
    VERIFICATION_NODE_UPDATE,

    VERIFICATION_AREANWKINFO_DELETE = 16,
    VERIFICATION_AE_DELETE,
    VERIFICATION_LOCATIONPOLICY_DELETE,
    VERIFICATION_CONTENTINSTANCE_DELETE,
    VERIFICATION_MGMTCMD_DELETE,
    VERIFICATION_CONTAINER_DELETE,
    VERIFICATION_REMOTECSE_DELETE,
    VERIFICATION_NODE_DELETE,

    VERIFICATION_END

};

static char mIsDisconnected = 0;
static enum VERIFICATION_STEP mStep = VERIFICATION_CSEBASE_RETRIEVE;

static char mDeviceKey[128] = "";

static char mNodeLink[23] = "";
static char mHostCSELink[23] = "";
static char mRemoteCSEResourceName[128] = "";
static char mContainerResourceName[128] = "";
static char mContentInstanceResourceName[128] = "";

static char mClientID[24] = "";

char* timeToString(struct tm *t) {
	static char s[20];
	sprintf(s, "%04d%02d%02d%02d%02d%02d",
			t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
			t->tm_hour, t->tm_min, t->tm_sec );
	return s;
}

/**
 * @brief do verification step
 */
void DoVerificationStep() {

    int resourceType;
    int operation;
    char to[512] = "";
    char buffer[128] = "";
    char* ri = ONEM2M_RI;
    //char* fr = NULL;
    void* pc = NULL;

    switch(mStep) {
        // RETRIEVE
        case VERIFICATION_CSEBASE_RETRIEVE:
            {
				resourceType = CSEBase;
				operation = RETRIEVE;
				memcpy(to, ONEM2M_TO, strlen(ONEM2M_TO));
				oneM2M_CSEBase CSEBase;
				memset(&CSEBase, 0, sizeof(CSEBase));
				CSEBase.ni = ONEM2M_NODEID;
				pc = (void *)&CSEBase;

            }
            break;

            // CREATE
        case VERIFICATION_NODE_CREATE:
            {
				resourceType = node;
				operation = CREATE;
				memcpy(to, ONEM2M_TO, strlen(ONEM2M_TO));
				oneM2M_node node;
				memset(&node, 0, sizeof(node));
				node.ni = ONEM2M_NODEID;
				snprintf(buffer, sizeof(buffer), NAME_POA, mClientID);
				node.mga = buffer;
				pc = (void *)&node;

            }
            break;
        case VERIFICATION_REMOTECSE_CREATE:
            {
				resourceType = remoteCSE;
				operation = CREATE;
				memcpy(to, ONEM2M_TO, strlen(ONEM2M_TO));
				oneM2M_remoteCSE remoteCSE;
				memset(&remoteCSE, 0, sizeof(remoteCSE));
				remoteCSE.cst = "3";
				remoteCSE.ni = ONEM2M_NODEID;
				remoteCSE.nm = ONEM2M_NODEID;
				remoteCSE.passCode = ONEM2M_PASSCODE;
				//snprintf(buffer, sizeof(buffer), NAME_POA, ONEM2M_NODEID);
				//remoteCSE.poa = buffer;
				remoteCSE.rr = "true";
				remoteCSE.nl = mNodeLink;
				pc = (void *)&remoteCSE;

            }
            break;
        case VERIFICATION_CONTAINER_CREATE:
            {
				resourceType = container;
				operation = CREATE;
				snprintf(to, sizeof(to), TO_REMOTECSE, ONEM2M_TO, mRemoteCSEResourceName);
				oneM2M_container container;
				memset(&container, 0, sizeof(container));
				container.ni = ONEM2M_NODEID;
				snprintf(buffer, sizeof(buffer), NAME_CONTAINER, ONEM2M_NODEID);
				container.nm = buffer;
				container.dKey = mDeviceKey;
				container.lbl = "con";
				pc = (void *)&container;


            }
            break;
        case VERIFICATION_MGMTCMD_CREATE:
            {
				resourceType = mgmtCmd;
				operation = CREATE;
				memcpy(to, ONEM2M_TO, strlen(ONEM2M_TO));
				oneM2M_mgmtCmd mgmtCmd;
				memset(&mgmtCmd, 0, sizeof(mgmtCmd));
				mgmtCmd.ni = ONEM2M_NODEID;
				snprintf(buffer, sizeof(buffer), NAME_MGMTCMD, ONEM2M_NODEID);
				mgmtCmd.nm = buffer;
				mgmtCmd.dKey = mDeviceKey;
                mgmtCmd.cmt = TAKEPHOTO_CMD;
				mgmtCmd.exe = "false";
				mgmtCmd.ext = mNodeLink;
				mgmtCmd.lbl = ONEM2M_NODEID;
				pc = (void *)&mgmtCmd;
            }
            break;
        case VERIFICATION_CONTENTINSTANCE_CREATE:
            {
				resourceType = contentInstance;
				operation = CREATE;
				snprintf(to, sizeof(to), TO_CONTAINER, ONEM2M_TO, mRemoteCSEResourceName, mContainerResourceName);
				oneM2M_contentInstance contentInstance;
				memset(&contentInstance, 0, sizeof(contentInstance));
				contentInstance.ni = ONEM2M_NODEID;
				contentInstance.dKey = mDeviceKey;
				contentInstance.cnf = "text";
				contentInstance.con = "45";
				pc = (void *)&contentInstance;
            }
            break;
         default:        
            mStep = VERIFICATION_END;
            break;
    }

	if(mStep < VERIFICATION_END) {
			if(pc != NULL) {
			tp_oneM2M_V1_Request(resourceType, operation, to, ri, pc);
		} 
	} 
}

static void SimpleXmlParser(char* payload, char* name, char* value, int isPC) {
    char start[10];
    char end[10];
    char* pl = payload;
    memset(start, 0, sizeof(start));
    memset(end, 0, sizeof(end));

    if(isPC) {
        pl = strstr(payload, "<pc>");
        if(!pl) return;
    }

    snprintf(start, sizeof(start), "<%s>", name);
    snprintf(end, sizeof(end), "</%s>", name);
    
    char* s = strstr(pl, start);
    char* e = strstr(pl, end);
    if(s && e) {
        s += strnlen(start, sizeof(start));
        memcpy(value, s, e-s);
        SKTDebugPrint(LOG_LEVEL_INFO, "[%s : %s]", name, value);
    }
}

static void SimpleJsonParser(char* jsonObject, char* value) {    
    char* loc = jsonObject;
    loc = strstr(jsonObject, ":");
    if(!loc) return;
    loc = strstr(loc, "\"");
    if(!loc) return;
    loc += 1;
    char* e = strstr(loc, "\"");
    if(loc && e) {
        memcpy(value, loc, e-loc);
        SKTDebugPrint(LOG_LEVEL_INFO, "[cmd : %s]", value);
    }
}

// FIXME
char* strnstr(char *s, char *text, size_t slen)
{
  char c, sc;
  size_t len;

  if ((c = *text++) != '\0') {
    len = strlen(text);
    do {
      do {
        if ((sc = *s++) == '\0' || slen-- < 1)
          return (NULL);
      } while (sc != c);
      if (len > slen)
        return (NULL);
    } while (strncmp(s, text, len) != 0);
    s--;
  }
  return ((char *)s);
}


static char* IsCMD(char* topic) {
  return strnstr(topic, "req", 20);
}

static void ProcessUpdateExecInstance(char* rn, char* ri, int success) {
  SKTDebugPrint(LOG_LEVEL_INFO, "[rn : %s, ri : %s]", rn, ri);
  char to[512] = "";
  snprintf(to, sizeof(to), TO_MGMTCMDRESULT, ONEM2M_TO, ONEM2M_NODEID, rn, ri);
  SKTDebugPrint(LOG_LEVEL_INFO, "to : %s", to);
#if 0
  oneM2M_mgmtCmdResult* mgmtCmdResult = (oneM2M_mgmtCmdResult *)calloc(sizeof(oneM2M_mgmtCmdResult), 1);  
  mgmtCmdResult->ni = ONEM2M_NODEID; 
  mgmtCmdResult->dKey = mDeviceKey;
  mgmtCmdResult->exr = "0";  
  mgmtCmdResult->exs = "3";  
  tp_oneM2M_V1_Request(execInstance, UPDATE, to, "1234", (void *)mgmtCmdResult);   
#else
  oneM2M_mgmtCmdResult mgmtCmdResult;  
  memset(&mgmtCmdResult, 0, sizeof(mgmtCmdResult));
  mgmtCmdResult.ni = ONEM2M_NODEID; 
  mgmtCmdResult.dKey = mDeviceKey;
  mgmtCmdResult.exr = "0";  
  mgmtCmdResult.exs = "3";  //3 SUCCESS
  tp_oneM2M_V1_Request(execInstance, UPDATE, to, "1234", (void *)&mgmtCmdResult);   
#endif
  
}

static void ProcessCMD(char* payload, int payloadLen) {
    SKTDebugPrint(LOG_LEVEL_INFO, "ProcessCMD");
    SKTDebugPrint(LOG_LEVEL_INFO, "payload : %.*s", payloadLen, payload);
    
    char cmt[128] = "";
    char exra[128] = "";
    char resourceid[23] = "";
    char value[10] = "";
    SimpleXmlParser(payload, ATTR_CMT, cmt, 1);
    SimpleXmlParser(payload, ATTR_EXRA, exra, 1);    
    SimpleXmlParser(payload, ATTR_RI, resourceid, 1);

    SimpleJsonParser(exra, value);

    if(strcmp(cmt, "RepPerChange") == 0) {
      int sec = atoi(value);
      if(sec > 0) {
//        mReportPeriod = sec*1000;
        ProcessUpdateExecInstance("RepPerChange", resourceid ,SUCCESS);
      }
    } else if(strcmp(cmt, TAKEPHOTO_CMD) == 0) {
		struct tm *t;
		time_t timer;
		timer = time(NULL);
		t = localtime(&timer); 
		char capture[128] ="";
		char captureUrl[128] ="";
		char* time = timeToString(t);
		
		sprintf(capture, "raspistill -w 640 -h 480 -o /home/pi/www/capture/%s.jpg -n -t 100",time);
		sprintf(captureUrl, "capture/%s.jpg",time);

		SKTDebugPrint(LOG_LEVEL_INFO, "TIME : %s\n",timeToString(t));
		
		int ret = system(capture);

		
		int resourceType;
		int operation;
		char to[512] = "";
			//char buffer[128] = "";
			//char* ri = ONEM2M_RI;
			//char* fr = NULL;
		void* pc = NULL;

		
		resourceType = contentInstance;
		operation = CREATE;
		snprintf(to, sizeof(to), TO_CONTAINER, ONEM2M_TO, mRemoteCSEResourceName, mContainerResourceName);
		oneM2M_contentInstance contentInstance;
		memset(&contentInstance, 0, sizeof(contentInstance));
		contentInstance.ni = ONEM2M_NODEID;
		contentInstance.dKey = mDeviceKey;
		contentInstance.cnf = "text";
		contentInstance.con = captureUrl;
		pc = (void *)&contentInstance;
		if(pc != NULL) {
			tp_oneM2M_V1_Request(resourceType, operation, to, resourceid, pc);
		}

		if(ret == 0){
			ProcessUpdateExecInstance(TAKEPHOTO_CMD, resourceid ,SUCCESS);
		}
		else{
			ProcessUpdateExecInstance(TAKEPHOTO_CMD, resourceid ,FAIL);
		}

		SKTDebugPrint(LOG_LEVEL_INFO, "TIME : %d\n",ret);
    } else if(strcmp(cmt,"DevReset") == 0) {
		// ToDo
    }
}
void MQTTConnected(int result) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTConnected result : %d", result);
	if(result < 0) {
		mIsDisconnected = 1;
	}
}

void MQTTSubscribed(int result) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTSubscribed result : %d", result);
    if(mStep != VERIFICATION_CONTENTINSTANCE_CREATE) {
      DoVerificationStep();
    }
}

void MQTTDisconnected(int result) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTDisconnected result : %d", result);
}

void MQTTConnectionLost(char* cause) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTConnectionLost result : %s", cause);
}

void MQTTMessageDelivered(int token) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTMessageDelivered token : %d, step : %d", token, mStep);
}

void MQTTMessageArrived(char* topic, char* msg, int msgLen) {
    SKTDebugPrint(LOG_LEVEL_INFO, "MQTTMessageArrived topic : %s, step : %d", topic, mStep);

    if(IsCMD(topic)) {
        ProcessCMD(msg, msgLen);
        return;    
    }
    char payload[1024] = "";
    memcpy(payload, msg, msgLen);
    SKTDebugPrint(LOG_LEVEL_INFO, "payload : %s", payload);
    char rsc[10] = "";
    SimpleXmlParser(payload, ATTR_RSC, rsc, 0);
    char rsm[128] = "";
    SimpleXmlParser(payload, ATTR_RSM, rsm, 0);
    SKTDebugPrint(LOG_LEVEL_INFO, "=============================================================================");    
    switch(mStep) {
        case VERIFICATION_CSEBASE_RETRIEVE:
            {
                mStep = VERIFICATION_NODE_CREATE;
            }
            break;
        case VERIFICATION_NODE_CREATE:
            {
                SimpleXmlParser(payload, ATTR_RI, mNodeLink, 1);
                SimpleXmlParser(payload, ATTR_HCL, mHostCSELink, 1);
                if(strlen(mNodeLink) == 0) {
                    mStep = VERIFICATION_END;
                    break;
                }
                mStep = VERIFICATION_REMOTECSE_CREATE; // static_cast<MINI_STEP>((int)mStep + 1);
            }
            break;

        case VERIFICATION_REMOTECSE_CREATE:
            {
                SimpleXmlParser(payload, ATTR_DKEY, mDeviceKey, 0);
                SimpleXmlParser(payload, ATTR_RN, mRemoteCSEResourceName, 0);
                if(strlen(mDeviceKey) == 0 || strlen(mRemoteCSEResourceName) == 0) {
                    mStep = VERIFICATION_END;
                    break;
                }
                mStep = VERIFICATION_CONTAINER_CREATE; //static_cast<MINI_STEP>((int)mStep + 1);
            }
            break;
            //        case VERIFICATION_LOCATIONPOLICY_CREATE:
            //            {
            //            SimpleXmlParser(payload, ATTR_RN, &mLocationPolicyResourceName, 1);
            //            if(strlen(mLocationPolicyResourceName) == 0) {
            //                mStep = VERIFICATION_END;
            //            }
            //            }
            //            break;
            //        case VERIFICATION_AE_CREATE:
            //            {
            //            SimpleXmlParser(payload, ATTR_RN, &mAEResourceName, 1);
            //            if(strlen(mAEResourceName) == 0) {
            //                mStep = VERIFICATION_END;
            //            }
            //            }
            //            break;
        case VERIFICATION_CONTENTINSTANCE_CREATE:
            {
                SimpleXmlParser(payload, ATTR_RN, mContentInstanceResourceName, 1);
//                beforeReportMillis = millis();
//                delay(90000);
                //            if(strlen(mContentInstanceResourceName) == 0) {
                //                mStep = VERIFICATION_END;
                //            }
            }
            break;
            //        case VERIFICATION_MGMTCMD_CREATE:
            //            {
            //            SimpleXmlParser(payload, ATTR_RN, &mMgmtCmdResourceName, 1);
            //            if(strlen(mMgmtCmdResourceName) == 0) {
            //                mStep = VERIFICATION_END;
            //            }
            //            }
            //            break;
            //        case VERIFICATION_AREANWKINFO_CREATE:
            //            {
            //            SimpleXmlParser(payload, ATTR_RN, &mAreaNwkInfoResourceName, 1);
            //            if(strlen(mAreaNwkInfoResourceName) == 0) {
            //                mStep = VERIFICATION_END;
            //            }
            //            }
            //            break;
        case VERIFICATION_CONTAINER_CREATE:
            {
                SimpleXmlParser(payload, ATTR_RN, mContainerResourceName, 1);
                if(strlen(mContainerResourceName) == 0) {
                    mStep = VERIFICATION_END;
                    break;
                }
                mStep = VERIFICATION_MGMTCMD_CREATE; //VERIFICATION_CONTENTINSTANCE_CREATE; //static_cast<MINI_STEP>((int)mStep + 1);
            }
            break;
        case VERIFICATION_MGMTCMD_CREATE:
            {
//                SimpleXmlParser(payload, ATTR_RN, &mContainerResourceName, 1);
//                if(strlen(mContainerResourceName) == 0) {
//                    mStep = VERIFICATION_END;
//                    break;
//                }
                mStep = VERIFICATION_CONTENTINSTANCE_CREATE; //static_cast<MINI_STEP>((int)mStep + 1);
            }
            break;
        default:
            break;
    }
    if(mStep != VERIFICATION_CONTENTINSTANCE_CREATE) {
      DoVerificationStep();
    }
}

/**
 * @brief get Device MAC Address without Colon.
 * @return mac address
 */
char* GetMacAddressWithoutColon() {
    int i, sock;
    struct ifreq ifr;
    char mac_adr[18] = "";

    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        return NULL;
    }

    strcpy(ifr.ifr_name, "eth0");
    if (ioctl(sock, SIOCGIFHWADDR, &ifr) < 0) {
        close(sock);
        return NULL;
    }

    for (i = 0; i < 6; i++) {
        sprintf(&mac_adr[i*2],"%02X",((unsigned char*)ifr.ifr_hwaddr.sa_data)[i]);
    }
    close(sock);

    return strdup(mac_adr);
}

/**
 * @brief main
 * @param[in] argc
 * @param[in] argv
 */
int main(int argc, char **argv) {
    SKTDebugInit(1, LOG_LEVEL_INFO, NULL);
    int rc;

    // set callbacks
    rc = tpMQTTSetCallbacks(MQTTConnected, MQTTSubscribed, MQTTDisconnected, MQTTConnectionLost, MQTTMessageDelivered, MQTTMessageArrived);
    SKTDebugPrint(LOG_LEVEL_INFO, "tpMQTTSetCallbacks result : %d", rc);

    // create
    char subscribeTopic[2][128];
    char publishTopic[128] = "";

    char* mac = GetMacAddressWithoutColon();
    memset(subscribeTopic, 0, sizeof(subscribeTopic));
    snprintf(mClientID, sizeof(mClientID), "%s_%s", ACCOUNT_USER, mac+8);
    if(mac) free(mac);

    memset(subscribeTopic, 0, sizeof(subscribeTopic));
    // snprintf(subscribeTopic[0], sizeof(subscribeTopic[0]), TOPIC_SUBSCRIBE_REQ, ONEM2M_NODEID);
    // snprintf(subscribeTopic[1], sizeof(subscribeTopic[1]), TOPIC_SUBSCRIBE_RES, ONEM2M_NODEID);
    // snprintf(publishTopic, sizeof(publishTopic), TOPIC_PUBLISH, ONEM2M_NODEID);

    snprintf(subscribeTopic[0], sizeof(subscribeTopic[0]), TOPIC_SUBSCRIBE_REQ, mClientID);
    snprintf(subscribeTopic[1], sizeof(subscribeTopic[1]), TOPIC_SUBSCRIBE_RES, mClientID);
    snprintf(publishTopic, sizeof(publishTopic), TOPIC_PUBLISH, mClientID, ONEM2M_CSEBASE);
    char* st[] = {subscribeTopic[0], subscribeTopic[1]};

    int port = (!MQTT_ENABLE_SERVER_CERT_AUTH ? MQTT_PORT : MQTT_SECURE_PORT);
	rc = tpSDKCreate(MQTT_HOST, port, MQTT_KEEP_ALIVE, ACCOUNT_USER, ACCOUNT_PASSWORD, MQTT_ENABLE_SERVER_CERT_AUTH, st, TOPIC_SUBSCRIBE_SIZE, publishTopic, mClientID);

    SKTDebugPrint(LOG_LEVEL_INFO, "tpSDKCreate result : %d", rc);

    while (mStep < VERIFICATION_END) {
	#if defined(WIN32) || defined(WIN64)
            Sleep(100);
	#else
            usleep(10000L);
			if(mIsDisconnected) {
				mIsDisconnected = 0;
			    tpSDKCreate(MQTT_HOST, MQTT_PORT, MQTT_KEEP_ALIVE, NULL, NULL, MQTT_ENABLE_SERVER_CERT_AUTH, st, TOPIC_SUBSCRIBE_SIZE, publishTopic, mClientID);
			    SKTDebugPrint(LOG_LEVEL_INFO, "tpSDKCreate result : %d", rc);
			}
	#endif
    }
    tpSDKDestory();
    return 0;
}




