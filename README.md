# POS Time Monitoring System
## Sistem Monitoring Waktu Produksi 5 POS Berbasis IoT

---

## Gambaran Sistem

Sistem monitoring waktu produksi real-time untuk 5 POS kerja menggunakan:
- **ESP32** - Mikrokontroler dengan WiFi
- **10 Push Button** - 2 per POS (START & STOP)
- **Node.js Server** - Backend dengan Express + Socket.io
- **MySQL Database** - Penyimpanan data
- **Web Dashboard** - Monitoring real-time

---

## Struktur Project

```
pos-wokwi/
├── src/
│   └── main.cpp              # ESP32 Firmware
├── server/
│   ├── server.js             # Node.js Backend
│   ├── package.json          # Dependencies
│   └── public/
│       └── index.html        # Dashboard Web
├── docs/
│   └── HARDWARE_SETUP.md     # Dokumentasi Hardware
├── platformio.ini            # PlatformIO Config
└── README.md                 # Dokumentasi Utama
```

---

## Quick Start (Simulasi)

Tanpa hardware? Gunakan simulator:

```bash
# 1. Start server
cd server
npm install
npm start

# 2. Buka dashboard
# Browser: http://localhost:3000

# 3. Test dengan simulator (terminal baru)
node scripts/simulate.js
```

---

## Dokumentasi Lengkap

### Untuk Setup dengan Hardware Fisik

Lihat dokumentasi lengkap di: [docs/HARDWARE_SETUP.md](docs/HARDWARE_SETUP.md)

Dokumentasi ini mencakup:
- Wiring diagram lengkap
- Pinout ESP32
- Konfigurasi WiFi
- Troubleshooting
- Checklist sebelum deploy

---

## Pin Mapping ESP32

| POS | START | STOP |
|-----|-------|------|
| POS 1 | GPIO 13 | GPIO 12 |
| POS 2 | GPIO 14 | GPIO 27 |
| POS 3 | GPIO 26 | GPIO 25 |
| POS 4 | GPIO 33 | GPIO 32 |
| POS 5 | GPIO 23 | GPIO 22 |

---

## Konfigurasi WiFi

Edit `platformio.ini`:
```ini
build_flags =
    -DWIFI_SSID="NAMA_WIFI"
    -DWIFI_PASSWORD="PASSWORD"
    -DSERVER_URL="http://192.168.100.50:3000"
```

---

## Database Info

- **Database:** pos-time
- **Host:** localhost:3306
- **User:** root
- **Password:** sidakaton

Database dan tabel dibuat otomatis saat server pertama kali berjalan.

---

## API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/log` | Catat START/STOP |
| GET | `/api/sessions` | Status semua POS |
| GET | `/api/history` | Riwayat log |

---

## Testing tanpa Hardware

### Via Dashboard
Buka http://localhost:3000 dan gunakan tombol test manual.

### Via cURL
```bash
# Start POS1
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"pos_id":1,"action":"START"}'

# Stop POS1
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"pos_id":1,"action":"STOP"}'
```

---

## Troubleshooting

### MySQL Connection Failed
```bash
# Test koneksi
mysql -u root -psidakaton -e "SELECT 1"
```

### ESP32 tidak connect WiFi
1. Cek SSID dan password di `platformio.ini`
2. Pastikan WiFi 2.4GHz (bukan 5GHz)
3. Cek Serial Monitor untuk error message

### Server tidak jalan
```bash
cd server
node test-mysql.js
npm start
```

---

## Author

**zalfyan**
- Sistem Monitoring Produksi 5 POS
- ESP32 + Node.js + MySQL
