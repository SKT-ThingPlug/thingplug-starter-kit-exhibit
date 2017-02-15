#ifndef _SMA_H_
#define _SMA_H_

#ifdef __cplusplus
extern "C" {
#endif

typedef enum _sma_sensor {
    ULTRASONIC_IDX,
    LIGHT_IDX,    
    TEMP_IDX,
    LED_IDX,   
    MOTION_IDX,
    HUMI_IDX, 
    SENSOR_IDX_MAX
} SMA_SENSOR_IDX;


void SMAInitSensor(int dist, int light, int temp, int led);
unsigned long SMAGetDistance();
void SMAGetData(char* sensor, char** output);
int SMAGetSensorIndex(char *sensorType);

#ifdef __cplusplus
}
#endif

#endif//_SMA_H_
