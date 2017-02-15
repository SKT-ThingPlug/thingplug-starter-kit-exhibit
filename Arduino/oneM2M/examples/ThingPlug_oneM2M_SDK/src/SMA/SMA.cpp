
/**
 * @file SMA.c
 *
 * @brief SensorManagementAgent Process
 *
 * Copyright (C) 2016. SKT, All Rights Reserved.
 * Written 2016,by SKT
 */

#include <Arduino.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "SMA.h"
#include <StreamWrapper.h>

#define SMA_STRCMP(x,y) strncmp(x,y,strlen(y))

int dummyIdx = 0;

int distPin;
int lightPin;
int tempPin;
int ledPin;

void SMAInitSensor(int dist, int light, int temp, int led) {
    distPin = dist;
    lightPin = light;
    tempPin = temp;
    ledPin = led;
    if(ledPin > 0) {
        pinMode(ledPin, OUTPUT);
    }
}

int SMAGetSensorIndex(char *sensorType)
{
    int idx = -1;
    if(SMA_STRCMP(sensorType,"UltraSonic") == 0 ) {
        idx = ULTRASONIC_IDX;
    } else if(SMA_STRCMP(sensorType,"light") == 0 ) {
        idx = LIGHT_IDX;
    } else if( SMA_STRCMP(sensorType, "temperature") == 0 ) {
        idx = TEMP_IDX;
    } else if( SMA_STRCMP(sensorType, "led") == 0 ) {
        idx = LED_IDX;
    } else if( SMA_STRCMP(sensorType,"motion") == 0 ) {
        idx = MOTION_IDX;
    } else if( SMA_STRCMP(sensorType, "humidity") == 0 ) {
        idx = HUMI_IDX;
    }
    return idx;
}

unsigned long SMAGetDistance() {
    unsigned long echo = 0;
    unsigned long value = 0;
    pinMode(distPin, OUTPUT); // Switch signalpin to output
    digitalWrite(distPin, LOW); // Send low pulse 
    delayMicroseconds(2); // Wait for 2 microseconds
    digitalWrite(distPin, HIGH); // Send high pulse
    delayMicroseconds(5); // Wait for 5 microseconds
    digitalWrite(distPin, LOW); // Holdoff
    pinMode(distPin, INPUT); // Switch signalpin to input
    digitalWrite(distPin, HIGH); // Turn on pullup resistor
    // please note that pulseIn has a 1sec timeout, which may
    // not be desirable. Depending on your sensor specs, you
    // can likely bound the time like this -- marcmerlin
    // echo = pulseIn(distPin, HIGH, 38000)
    echo = pulseIn(distPin, HIGH); //Listen for echo
    value = (echo/2) / 29.1;
    return value;
}

void SMAGetData(char *sensorType, char** output)
{
    int idx = SMAGetSensorIndex(sensorType);
    switch(idx) {
        case ULTRASONIC_IDX:
        {
            char distance[10] = "";
            unsigned long r = SMAGetDistance();
            snprintf(distance, sizeof(distance), "%ld", r);
            *output = strdup(distance);
            break;
        }
        case LIGHT_IDX:
        {
            char light[10] = "";
            int r = analogRead(lightPin)/2;
            snprintf(light, sizeof(light), "%d", r/2); // half value when 5V 
            *output = strdup(light);
            break;
        }
        case TEMP_IDX:
        {
            char temp[10] = "";
            int base = analogRead(tempPin);
            float R = 1024.0/((float)base)-1.0; 
            int B = 4275;
            R = 100000.0 * R;
            float r = 1.0/(log(R/100000.0)/B+1/298.15)-273.15;            
            snprintf(temp, sizeof(temp), "%d", (int)(r*100/2)); // half value when 5V
            *output = strdup(temp);
            break;
        }
        case LED_IDX:
            break;
        case MOTION_IDX:
            if( dummyIdx == 0 ) {
                *output = strdup("1");
            } else {
                *output = strdup("0");
            }
            break;            
        case HUMI_IDX:
            if( dummyIdx == 0 ) {
                *output = strdup("48");
            } else {
                *output = strdup("44");
            }
            break;
        default:
			*output = NULL;
            break;
    }
	dummyIdx++;
	dummyIdx%=2;
    Stream_print(NULL,"SMAGetData  = <%s:%s>\n", sensorType, *output);
}

