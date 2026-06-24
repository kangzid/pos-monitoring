# Dokumentasi Sistem Monitoring Waktu Produksi 5 POS Berbasis IoT

## Daftar Isi
1. [Gambaran Sistem](#gambaran-sistem)
2. [Komponen yang Dibutuhkan](#komponen-yang-dibutuhkan)
3. [Wiring Diagram](#wiring-diagram)
4. [Konfigurasi ESP32](#konfigurasi-esp32)
5. [Setup Server](#setup-server)
6. [Setup Database](#setup-database)
7. [Dashboard](#dashboard)
8. [Troubleshooting](#troubleshooting)

---

## Gambaran Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARSIITEKTUR SISTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│   │  POS 1  │  │  POS 2  │  │  POS 3  │  │  POS 4  │  │  POS 5  │   │
│   │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │   │
│   │ │START│ │  │ │START│ │  │ │START│ │  │ │START│ │  │ │START│ │   │
│   │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │   │
│   │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │   │
│   │ │STOP │ │  │ │STOP │ │  │ │STOP │ │  │ │STOP │ │  │ │STOP │ │   │
│   │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │  │ └──┬──┘ │   │
│   └────┼────┘  └────┼────┘  └────┼────┘  └────┼────┘  └────┼────┘   │
│        │           │           │           │           │           │
│        └───────────┴───────────┴───────────┴───────────┘           │
│                              │                                     │
│                    ┌─────────┴─────────┐                           │
│                    │     ESP32        │                           │
│                    │   DevKit V1      │                           │
│                    └─────────┬─────────┘                           │
│                              │                                     │
│                    ┌─────────▼─────────┐                           │
│                    │     WiFi/LAN      │                           │
│                    └─────────┬─────────┘                           │
│                              │                                     │
│                    ┌─────────▼─────────┐                           │
│                    │   Node.js Server  │                           │
│                    │   Port 3000       │                           │
│                    └─────────┬─────────┘                           │
│                              │                                     │
│                    ┌─────────▼─────────┐                           │
│                    │     MySQL        │                           │
│                    │   Database       │                           │
│                    └─────────┬─────────┘                           │
│                              │                                     │
│                    ┌─────────▼─────────┐                           │
│                    │  Web Dashboard    │                           │
│                    │  Real-time        │                           │
│                    └───────────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Komponen yang Dibutuhkan

### Hardware
| No | Komponen | Jumlah | Keterangan |
|----|----------|--------|------------|
| 1 | ESP32 DevKit V1 | 1 | Mikrokontroler dengan WiFi |
| 2 | Push Button | 10 | 2 per POS (START & STOP) |
| 3 | Resistor 10kΩ | 10 | Pull-down resistor (optional) |
| 4 | Breadboard / PCB | 1 | Untuk prototyping |
| 5 | Kabel Jumper | Secukupnya | Untuk wiring |
| 6 | Power Supply | 1 | USB 5V untuk ESP32 |

### Software
| No | Software | Keterangan |
|----|----------|------------|
| 1 | Node.js | Untuk server backend |
| 2 | MySQL | Database |
| 3 | PlatformIO | Untuk flash firmware ke ESP32 |
| 4 | VS Code | IDE (optional) |

---

## Wiring Diagram

### Pinout ESP32 DevKit V1

```
        ┌─────────────────────────────┐
        │                             │
        │      ESP32 DevKit V1        │
        │                             │
        │  ┌─────────────────────┐    │
        │  │    3V3        GND   │    │
        │  │    GND        GPIO0 │    │
        │  │    GPIO2     GPIO4  │    │
        │  │    GPIO4     GPIO2  │    │
        │  │    GPIO13↑   GPIO15 │    │
        │  │    GPIO12↓   GPIO14 │    │
        │  │    GPIO27    GPIO16 │    │
        │  │    GPIO26    GPIO17 │    │
        │  │    GPIO25    GPIO5  │    │
        │  │    GPIO33    GPIO18 │    │
        │  │    GPIO32    GPIO19 │    │
        │  │    GPIO35    GPIO21 │    │
        │  │    GPIO34    GPIO22 │    │
        │  │    GPIO39    GPIO23 │    │
        │  └─────────────────────┘    │
        │                             │
        │  USB (Power & Programming)   │
        └─────────────────────────────┘

↑ = Pin untuk tombol START (GPIO13)
↓ = Pin untuk tombol STOP  (GPIO12)
```

### Tabel Wiring Detail

| POS | Tombol | Fungsi | GPIO ESP32 | Warna Kabel |
|-----|--------|--------|------------|------------|
| POS 1 | START | Mulai produksi | GPIO 13 | Hijau |
| POS 1 | STOP | Stop produksi | GPIO 12 | Merah |
| POS 2 | START | Mulai produksi | GPIO 14 | Hijau |
| POS 2 | STOP | Stop produksi | GPIO 27 | Merah |
| POS 3 | START | Mulai produksi | GPIO 26 | Hijau |
| POS 3 | STOP | Stop produksi | GPIO 25 | Merah |
| POS 4 | START | Mulai produksi | GPIO 33 | Hijau |
| POS 4 | STOP | Stop produksi | GPIO 32 | Merah |
| POS 5 | START | Mulai produksi | GPIO 23 | Hijau |
| POS 5 | STOP | Stop produksi | GPIO 22 | Merah |

### Skema Wiring

```
ESP32                          Push Buttons
──────                         ─────────────

3V3  ──────────────────────┬──> [START 1] pin 1 (kiri)
                          │
GND  ──────────────────────┼──> [START 1] pin 2 (kiri)
                          │    [STOP 1] pin 2 (kiri)
                          │
GPIO13 ────────────────────┼──> [START 1] pin 1 (kanan)
                          │
GPIO12 ────────────────────┼──> [STOP 1] pin 1 (kanan)
                          │
... (ulangi untuk POS 2-5) │
```

### Catatan Wiring
- **Pull-up internal**: GPIO ESP32 sudah memiliki pull-up internal, jadi tidak perlu resistor eksternal
- **Tombol normally open**: Saat tombol tidak ditekan, ESP32 membaca HIGH
- **Tombol pressed**: Saat tombol ditekan, ESP32 membaca LOW (ground)

---

## Konfigurasi ESP32

### 1. Edit platformio.ini

```ini
; File: platformio.ini

[env:esp32doit-devkit-v1]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino

; WiFi Configuration
; Ganti dengan SSID dan password WiFi Anda
build_flags =
    -DWIFI_SSID="NAMA_WIFI_ANDA"
    -DWIFI_PASSWORD="PASSWORD_WIFI"
    -DSERVER_URL="http://192.168.100.50:3000"

; Library dependencies
lib_deps =
    bblanchon/ArduinoJson

; Serial Monitor
monitor_speed = 115200
```

### 2. Konfigurasi Pin di main.cpp

```cpp
// File: src/main.cpp

// Konfigurasi PIN untuk 5 POS
// POS 1: START=GPIO13, STOP=GPIO12
// POS 2: START=GPIO14, STOP=GPIO27
// POS 3: START=GPIO26, STOP=GPIO25
// POS 4: START=GPIO33, STOP=GPIO32
// POS 5: START=GPIO23, STOP=GPIO22
```

### 3. Upload Firmware

```bash
# Connect ESP32 via USB
# Buka terminal di folder project

# Upload firmware
pio run -t upload

# Atau untuk monitor serial
pio run -t upload
pio device monitor
```

### 4. Verifikasi Koneksi

Setelah upload, cek Serial Monitor (baudrate 115200). Seharusnya menampilkan:

```
rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)
...
Connecting to WiFi...
WiFi Connected!
IP Address: 192.168.100.100
SYSTEM READY
Server URL: http://192.168.100.50:3000
```

---

## Setup Server

### 1. Install Node.js Dependencies

```bash
cd server
npm install
```

### 2. Konfigurasi Database

Edit file `server.js` jika perlu:

```javascript
// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'sidakaton'
};
```

### 3. Jalankan Server

```bash
cd server
npm start
```

Output yang diharapkan:

```
╔════════════════════════════════════════════╗
║   POS Time Server Running Successfully!   ║
╠════════════════════════════════════════════╣
║   Dashboard: http://localhost:3000         ║
╚════════════════════════════════════════════╝

Waiting for ESP32 button presses...
```

---

## Setup Database

Database `pos-time` dan tabel akan dibuat otomatis saat server pertama kali dijalankan.

### Struktur Tabel

#### Table: production_logs
```sql
CREATE TABLE production_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_id INT NOT NULL,
    action ENUM('START', 'STOP') NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pos_id (pos_id),
    INDEX idx_timestamp (timestamp)
);
```

#### Table: sessions
```sql
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_id INT NOT NULL UNIQUE,
    start_time DATETIME NOT NULL,
    end_time DATETIME DEFAULT NULL,
    duration_seconds INT DEFAULT NULL,
    status ENUM('ACTIVE', 'COMPLETED') DEFAULT 'ACTIVE',
    INDEX idx_pos_id (pos_id)
);
```

### Verifikasi Database

```bash
mysql -u root -psidakaton

USE pos-time;
SHOW TABLES;
DESC production_logs;
DESC sessions;
```

---

## Dashboard

### Akses Dashboard

Buka browser dan akses:
```
http://localhost:3000
```

### Fitur Dashboard

1. **Monitoring Real-time** - Lihat status 5 POS secara live
2. **Timer** - Waktu produksi aktif untuk setiap POS
3. **Statistik** - Sesi dan total waktu harian
4. **Aktivitas Log** - Riwayat button press terakhir
5. **Tombol Test** - Untuk simulasi tanpa hardware

### Tampilan Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    POS Time Monitor                         │
│               Sistem Monitoring Waktu Produksi              │
│                                                              │
│           [Status: Connected/Disconnected]                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Aktif: 3    Total Sesi: 12    Total Waktu: 2h 15m     │
│                                                              │
├──────────────┬──────────────┬──────────────┬──────────────┬──┤
│   POS 1      │   POS 2      │   POS 3      │   POS 4      │  │
│  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  │
│  │ RUNNING│  │  │ RUNNING│  │  │  IDLE  │  │  │  IDLE  │  │  │
│  │ 01:23  │  │  │ 00:45  │  │  │ 00:00  │  │  │ 00:00  │  │  │
│  │ Sesi:3 │  │  │ Sesi:2 │  │  │ Sesi:1 │  │  │ Sesi:0 │  │  │
│  │ 2h 15m │  │  │ 1h 30m │  │  │ 0h 30m │  │  │ 0h 00m │  │  │
│  └────────┘  │  └────────┘  │  └────────┘  │  └────────┘  │  │
├──────────────┴──────────────┴──────────────┴──────────────┴──┤
│                                                              │
│                        [Test Server]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### ESP32 tidak bisa connect WiFi

```
Diagnosa:
1. Cek SSID dan password WiFi di platformio.ini
2. Pastikan WiFi menggunakan 2.4GHz (bukan 5GHz)
3. Cek jangkauan WiFi dari posisi ESP32
4. Pastikan tidak ada firewall blocking

Solusi:
- Dekatkan ESP32 ke router
- Gunakan WiFi dengan sinyal kuat
- CekSerial Monitor untuk pesan error
```

### Server tidak bisa connect MySQL

```
Diagnosa:
1. Pastikan MySQL service berjalan
2. Cek username/password
3. Cek port MySQL (default: 3306)

Solusi (Windows):
- Buka Services (services.msc)
- Cari "MySQL80" atau "MySQL"
- Pastikan status "Running"

Solusi (Check connection):
- Buka MySQL Workbench atau command line
- Test: mysql -u root -psidakaton -e "SELECT 1"
```

### ESP32 kirim data tapi response 500

```
Diagnosa:
1. Database tidak ada
2. Tabel tidak ada
3. Permission issue

Solusi:
1. Hapus dan buat ulang database:
   mysql -u root -psidakaton -e "DROP DATABASE IF EXISTS pos-time"

2. Restart server (database akan dibuat otomatis)

3. Check error di terminal server
```

### Dashboard tidak connect ke server

```
Diagnosa:
1. Server tidak running
2. Port salah
3. Firewall blocking

Solusi:
1. Pastikan server running: npm start
2. Cek port di dashboard (default: 3000)
3. Matikan firewall sementara:
   Windows: netsh advfirewall set allprofiles state off
4. Atau allow port 3000:
   Windows Firewall > Inbound Rules > New Rule > Port 3000
```

---

## API Reference

### POST /api/log
Catat button press

**Request:**
```json
{
  "pos_id": 1,
  "action": "START"
}
```

**Response:**
```json
{
  "success": true,
  "pos_id": 1,
  "action": "START"
}
```

### GET /api/sessions
Ambil status semua POS

**Response:**
```json
{
  "1": {
    "active": true,
    "start_time": "2024-01-15T10:30:00",
    "elapsed_seconds": 3600,
    "sessions_today": 3,
    "total_seconds_today": 7200
  },
  "2": { ... },
  "3": { ... },
  "4": { ... },
  "5": { ... }
}
```

### GET /api/history
Ambil riwayat log

**Response:**
```json
[
  { "id": 1, "pos_id": 1, "action": "START", "timestamp": "2024-01-15T10:30:00" },
  { "id": 2, "pos_id": 1, "action": "STOP", "timestamp": "2024-01-15T11:30:00" }
]
```

---

## Diagram Alur Kerja

```
┌─────────────────────────────────────────────────────────────────┐
│                      ALUR KERJA SISTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Operator tekan tombol START]                                  │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  ESP32 mendeteksi     │                                     │
│  │  LOW pada GPIO        │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Cek debounce         │                                     │
│  │  (200ms)              │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Kirim HTTP POST      │                                     │
│  │  /api/log             │                                     │
│  │  {pos_id, action}     │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Node.js Server       │                                     │
│  │  terima request       │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Simpan ke MySQL      │                                     │
│  │  - production_logs    │                                     │
│  │  - sessions           │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Broadcast via        │                                     │
│  │  Socket.io            │                                     │
│  └───────────┬───────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────┐                                     │
│  │  Dashboard update     │                                     │
│  │  real-time            │                                     │
│  └───────────────────────┘                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist Sebelum Deploy

### Hardware
- [ ] ESP32 terhubung ke power
- [ ] Semua 10 tombol terhubung dengan benar
- [ ] Kabel tidak longgar

### Konfigurasi
- [ ] WiFi SSID dan Password sudah benar
- [ ] Server URL sudah benar (IP komputer server)
- [ ] MySQL credentials sudah benar

### Server
- [ ] MySQL service running
- [ ] Node.js server running
- [ ] Port 3000 tidak diblokir firewall

### Testing
- [ ] ESP32 connect ke WiFi
- [ ] ESP32 kirim data berhasil (HTTP 200)
- [ ] Dashboard menampilkan update
- [ ] Data tersimpan di database

---

## Kontak & Dukungan

Jika ada pertanyaan atau masalah:
1. Cek troubleshooting di atas
2. Lihat logs di terminal server
3. Cek Serial Monitor ESP32

---

**Versi Dokumen:** 1.0
**Terakhir Diperbarui:** 2024-01-15
**Author:** Zalfyan