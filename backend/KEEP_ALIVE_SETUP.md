# 🛡️ Kyro Social: 2-Layer Keep-Alive Guide (Render & MongoDB)

## 🎯 The Problem
On free hosting tiers:
1. **Render Free Web Service**: Automatically spins down after **15 minutes** of no incoming external HTTP traffic. Waking it up upon a cold start takes 30-50+ seconds.
2. **MongoDB Atlas Free (M0)**: Inactive database connection pools drop idle sockets or become dormant, causing the next query to lag.

To solve this, we use a **two-layer keep-alive strategy** powered by an active **Server + Database Health Check endpoint**.

---

## 🩺 The Unified Health Endpoint (`/api/health`)

- **URL**: `https://kyro-social-backend.onrender.com/api/health`
- **Supported Methods**: `GET` and `HEAD` (UptimeRobot uses `HEAD` by default; Cron-Job.org uses `GET`)
- **What it does**:
  1. Checks Node.js/Express process health, uptime, and memory usage.
  2. Executes an active database ping: `mongoose.connection.db.command({ ping: 1 })`.
  3. Returns **HTTP 200 OK** (with `X-Database-Status` and `X-Database-Latency` headers) if both the server and MongoDB Atlas respond successfully.
  4. Returns **HTTP 503** if MongoDB is disconnected or encountering an error.

### Example Response:
```json
{
  "status": "ok",
  "uptime": 1420,
  "timestamp": "2026-10-26T02:22:00.000Z",
  "server": {
    "status": "up",
    "environment": "production",
    "memory": {
      "rss": "85 MB",
      "heapUsed": "42 MB"
    }
  },
  "database": {
    "status": "connected",
    "latency": "14ms"
  },
  "totalResponseTime": "16ms"
}
```

---

## ⚙️ Layer 1: Backend Self-Ping (Built into Code)

The backend has an automated internal timer that triggers an HTTP ping to itself every **10 minutes**:
- Render automatically injects `RENDER_EXTERNAL_URL` in production (e.g., `https://kyro-social.onrender.com`).
- The server detects this URL, targets `/api/health`, and logs the status and database latency.
- **Optional**: You can also manually add `SELF_PING_URL=https://your-app.onrender.com` in your Render Environment Variables dashboard.

> ⚠️ **Why Layer 1 is not enough alone:** If Render ever enters deep sleep (e.g. after a maintenance reboot or cold spin-down), internal timers stop running. That is why **Layer 2 (External Pingers)** is essential.

---

## 🌐 Layer 2: External Pingers (2 Free Services Setup)

Using 2 independent external pingers ensures 100% redundancy: if one service has downtime or network delay, the second pinger keeps your server and database awake.

---

### 1️⃣ Service 1: UptimeRobot (Free & Recommended)
**UptimeRobot** provides 50 free monitors with 5-minute intervals.

1. Go to [https://uptimerobot.com/](https://uptimerobot.com/) and create a free account.
2. In the Dashboard, click **"+ Add New Monitor"**.
3. Configure the monitor:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Kyro Social Backend Health`
   - **URL (or IP)**: `https://kyro-social-backend.onrender.com/api/health`
   - **Monitoring Interval**: `5 minutes` or `10 minutes`
   - **Monitor Timeout**: `30 seconds`
4. Click **"Create Monitor"**.

✅ *Result*: UptimeRobot will send an HTTP GET request to `/api/health` every 5-10 minutes, keeping both Render and MongoDB Atlas permanently awake.

---

### 2️⃣ Service 2: Cron-Job.org (Free & Highly Configurable)
**Cron-Job.org** allows you to schedule HTTP cron requests at exact intervals completely free.

1. Go to [https://cron-job.org/en/](https://cron-job.org/en/) and register for free.
2. Go to the **"Cronjobs"** tab and click **"Create cronjob"**.
3. Configure the cronjob:
   - **Title**: `Kyro Render & DB Ping`
   - **URL**: `https://kyro-social-backend.onrender.com/api/health`
   - **Schedule**: `User-defined` -> **"Every 10 minutes"** (or every 12 minutes)
   - **Request Method**: `GET`
   - **Failures / Notifications**: Enable email alert if desired
4. Click **"Create"**.

✅ *Result*: Cron-Job.org acts as a secondary external keep-alive worker, ensuring zero downtime even if Render would otherwise go to sleep.

---

### 🌟 Bonus Alternative (Backup)
If you prefer an alternative to either service:
- **Better Stack (Better Uptime)**: [https://betterstack.com/uptime](https://betterstack.com/uptime) (Free 3-minute checks).
- **Healthchecks.io**: [https://healthchecks.io/](https://healthchecks.io/).

---

## 🧪 Testing Your Setup

1. Open your browser and navigate to:
   ```
   https://kyro-social-backend.onrender.com/api/health
   ```
2. Verify you get:
   - Status code: `200 OK`
   - `"status": "ok"`
   - `"database": { "status": "connected", "latency": "Xms" }`
3. Check your Render backend logs:
   - You should see `[Keep-Alive] Ping sent to ... | Status: 200 | DB: connected`.
