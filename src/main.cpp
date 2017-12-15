#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============== CONFIGURATION ==============
// Update these values for your network and server
#ifndef WIFI_SSID
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""
#define SERVER_URL "http://192.168.100.50:3000"
#endif

// ============== BUTTON PINS ==============
// POS 1: START=13, STOP=12
// POS 2: START=14, STOP=27
// POS 3: START=26, STOP=25
// POS 4: START=33, STOP=32
// POS 5: START=23, STOP=22

struct ButtonConfig {
  int posId;
  int startPin;
  int stopPin;
};

const ButtonConfig POS[] = {
  {1, 13, 12},
  {2, 14, 27},
  {3, 26, 25},
  {4, 33, 32},
  {5, 23, 22}
};

// Track button states (for edge detection)
bool lastStateStart[] = {HIGH, HIGH, HIGH, HIGH, HIGH};
bool lastStateStop[] = {HIGH, HIGH, HIGH, HIGH, HIGH};

// Debounce delay
const unsigned long DEBOUNCE_MS = 200;
unsigned long lastPressTime = 0;

// ============== PROTOTYPES ==============
void setupWiFi();
void sendLog(int posId, const char* action);

// ============== SETUP ==============
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Configure button pins
  for (int i = 0; i < 5; i++) {
    pinMode(POS[i].startPin, INPUT_PULLUP);
    pinMode(POS[i].stopPin, INPUT_PULLUP);
    Serial.printf("POS%d: START=%d, STOP=%d\n", POS[i].posId, POS[i].startPin, POS[i].stopPin);
  }

  // Connect to WiFi
  setupWiFi();

  Serial.println("SYSTEM READY");
  Serial.printf("Server URL: %s\n", SERVER_URL);
}

// ============== MAIN LOOP ==============
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    setupWiFi();
  }

  // Check each POS button
  for (int i = 0; i < 5; i++) {
    int posId = POS[i].posId;

    // Check START button (falling edge detection)
    bool currentStart = digitalRead(POS[i].startPin);
    if (currentStart == LOW && lastStateStart[i] == HIGH) {
      if (millis() - lastPressTime > DEBOUNCE_MS) {
        Serial.printf("POS%d START\n", posId);
        sendLog(posId, "START");
        lastPressTime = millis();
      }
    }
    lastStateStart[i] = currentStart;

    // Check STOP button (falling edge detection)
    bool currentStop = digitalRead(POS[i].stopPin);
    if (currentStop == LOW && lastStateStop[i] == HIGH) {
      if (millis() - lastPressTime > DEBOUNCE_MS) {
        Serial.printf("POS%d STOP\n", posId);
        sendLog(posId, "STOP");
        lastPressTime = millis();
      }
    }
    lastStateStop[i] = currentStop;
  }

  delay(10); // Small delay for stability
}

// ============== WIFI FUNCTIONS ==============
void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi Connection Failed!");
  }
}

// ============== HTTP FUNCTIONS ==============
void sendLog(int posId, const char* action) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot send log");
    return;
  }

  HTTPClient http;
  StaticJsonDocument<200> doc;

  doc["pos_id"] = posId;
  doc["action"] = action;

  String requestBody;
  serializeJson(doc, requestBody);

  String url = String(SERVER_URL) + "/api/log";
  Serial.printf("Sending to: %s\n", url.c_str());
  Serial.printf("Body: %s\n", requestBody.c_str());

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("HTTP Response: %d - %s\n", httpResponseCode, response.c_str());
  } else {
    Serial.printf("HTTP Error: %d - %s\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}