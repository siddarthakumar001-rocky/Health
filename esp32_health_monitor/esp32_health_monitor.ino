#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- CONFIGURATION ---
const char* ssid = "health_pluse";
const char* password = "ESP@32";
const char* baseUrl = "http://192.168.1.100:8000/api/v1"; // REPLACE WITH YOUR SERVER IP
const char* deviceId = "ESP32-HEALTH-001";

// --- SETTINGS ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SEND_INTERVAL 5000
#define WIFI_RETRY_INTERVAL 10000
#define WIFI_TIMEOUT 15000

// --- OBJECTS ---
MAX30105 particleSensor;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- STATE VARIABLES ---
unsigned long lastSendTime = 0;
unsigned long lastWifiRetryTime = 0;
unsigned long wifiStartTime = 0;
bool isRegistered = true; 
bool wifiConnecting = false;

// Sensor data
float lastHeartRate = 0;
float lastSpO2 = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// --- HELPERS ---
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  wifiStartTime = millis();
  wifiConnecting = true;
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
}

void updateDisplay(const char* status, float hr, float spo2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(0, 0);
  display.println("Health Pulse - ESP32");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  display.setCursor(0, 20);
  display.print("WiFi: ");
  display.println(status);

  display.setCursor(0, 40);
  display.print("HR: ");
  if (hr > 0) display.print((int)hr); else display.print("--");
  display.println(" bpm");

  display.setCursor(0, 50);
  display.print("SpO2: ");
  if (spo2 > 0) display.print((int)spo2); else display.print("--");
  display.println(" %");

  display.display();
}

void sendData() {
  if (WiFi.status() != WL_CONNECTED || !isRegistered) return;

  long irValue = particleSensor.getIR();
  bool fingerDetected = (irValue > 50000);

  // Validate data
  float hrToSend = (fingerDetected && lastHeartRate > 0) ? lastHeartRate : -1;
  float spo2ToSend = (fingerDetected && lastSpO2 >= 80) ? lastSpO2 : -1;

  HTTPClient http;
  String url = String(baseUrl) + "/health-data";
  http.begin(url);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  
  if (hrToSend > 0) doc["heart_rate"] = hrToSend;
  else doc["heart_rate"] = nullptr;

  if (spo2ToSend > 0) doc["spo2"] = spo2ToSend;
  else doc["spo2"] = nullptr;

  doc["temperature"] = nullptr;
  doc["hrv"] = nullptr; // Optional
  doc["latitude"] = 12.9716;
  doc["longitude"] = 77.5946;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("Sending data: " + requestBody);
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == 200) {
    Serial.println("Data sent successfully!");
  } else if (httpResponseCode == 404) {
    Serial.println("Device not registered (404)! Stopping transmission.");
    isRegistered = false;
  } else if (httpResponseCode == 422) {
    Serial.println("Validation Error (422). Check backend logs.");
  } else {
    Serial.print("Error sending data. Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// --- CORE ---
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Health Monitor Starting...");

  // OLED Init
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println("SSD1306 allocation failed");
  } else {
    display.clearDisplay();
    display.display();
  }

  // Sensor Init (SDA: 21, SCL: 22 by default on ESP32)
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found. Please check wiring.");
    updateDisplay("Sensor Err", 0, 0);
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  connectWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. WiFi Connection Management (Non-blocking)
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnecting) {
      if (currentMillis - wifiStartTime >= WIFI_TIMEOUT) {
        Serial.println("WiFi Timeout. Retrying later.");
        WiFi.disconnect();
        wifiConnecting = false;
        lastWifiRetryTime = currentMillis;
      }
    } else {
      if (currentMillis - lastWifiRetryTime >= WIFI_RETRY_INTERVAL) {
        connectWiFi();
      }
    }
  } else {
    if (wifiConnecting) {
      Serial.println("WiFi Connected!");
      Serial.print("IP Address: ");
      Serial.println(WiFi.localIP());
      wifiConnecting = false;
    }
  }

  // 2. Sensor Sampling (Constant polling for beats)
  long irValue = particleSensor.getIR();
  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      beatAvg = (int)beatsPerMinute; // Low-pass filter would be better, but keeping it simple
      lastHeartRate = (float)beatAvg;
    }
  }
  
  // Dummy SpO2 calculation (actual calculation requires a complex algorithm or library like SparkFun's SpO2 example)
  // For this project, we'll assume a value if finger is detected and IR is stable.
  if (irValue > 50000) {
    if (lastSpO2 == 0) lastSpO2 = 98.0; 
    // Usually SpO2 fluctuates less than HR. Real implementation would use red/ir ratios.
  } else {
    lastHeartRate = 0;
    lastSpO2 = 0;
  }

  // 3. Periodic Tasks
  if (currentMillis - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentMillis;
    
    // Update Display
    const char* wifiStatus = (WiFi.status() == WL_CONNECTED) ? "CONNECTED" : "DISCONNECTED";
    updateDisplay(wifiStatus, lastHeartRate, lastSpO2);
    
    // Send Data
    sendData();
  }
}
