#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// --- CONFIGURATION ---
const char* ssid = "S_K";
const char* password = "SKsidd@005";
const char* baseUrl = "http://YOUR_LOCAL_IP:5001/api/device"; // Update with your computer's IP
const char* deviceId = "ESP32-001";

// --- SENSOR PINS ---
#define ONE_WIRE_BUS 4 // DS18B20 data pin connected to GPIO 4

// --- OBJECTS ---
MAX30105 particleSensor;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Heart rate variables
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing ESP32 Health Monitor...");

  // WiFi Setup
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  // --- STEP 2: DEVICE REGISTRATION ---
  registerDevice();

  // MAX30102 Setup
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found. Please check wiring/power.");
  } else {
    particleSensor.setup(); 
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  // Temperature Sensor Setup
  sensors.begin();
}

void registerDevice() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(baseUrl) + "/register";
    Serial.println("Hitting Registry: " + url);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<100> doc;
    doc["deviceId"] = deviceId;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode > 0) {
      Serial.println("Registration Success! Code: " + String(httpResponseCode));
    } else {
      Serial.println("Registration Failed. Error: " + http.errorToString(httpResponseCode));
      Serial.println("Check if your Backend is running on port 5001 and your IP is correct.");
    }
    http.end();
  } else {
    Serial.println("WiFi NOT connected. Cannot register.");
  }
}

void loop() {
  // 1. Read Sensors
  long irValue = particleSensor.getIR();
  int hr = 75; // Fallback
  int spo2 = 98; // Fallback
  
  if (irValue > 50000) {
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      if (beatsPerMinute < 255 && beatsPerMinute > 20) hr = (int)beatsPerMinute;
    }
  }

  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);
  if (tempC < 0) tempC = 36.5; // Fallback

  // --- STEP 3: SEND SENSOR DATA ---
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(baseUrl) + "/data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["deviceId"] = deviceId;
    doc["heartRate"] = hr;
    doc["spo2"] = spo2;
    doc["temperature"] = tempC;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.println("Data POST: " + String(httpResponseCode));
    http.end();
  }

  delay(5000); // Send every 5 seconds as requested
}
