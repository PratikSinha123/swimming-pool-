# 🏊 Hostel Swimming Pool Entry & Management System

A modern, mobile-friendly, QR-code-based swimming pool entry and management system designed for hostel students and wardens.

Built with **React 19**, **Vite**, **Tailwind CSS**, and **TypeScript**, ready for **1-click Vercel deployment** with automatic **Google Sheets sync**.

---

## 🌟 Key Features

### 1. 📱 Student Mobile Check-In (Scanned via QR Code)
- **Instant Scan & Enter**: Students scan the QR code posted at the pool entrance using their smartphone camera.
- **Entry Form**:
  - Full Student Name
  - Hostel Room Number (e.g., `B-204`)
  - Student Roll No / ID (e.g., `2024CS081`)
  - Phone Number
  - Safety & Shower rules acknowledgement
- **Live Pass with Countdown Timer**:
  - Displays student's active swimming pass with session timer.
  - Alerts student when session time limit or pool closing time is approaching.
  - One-tap **"Exit Pool / Check Out"** button to record exit time.

### 2. 🛡️ Warden Admin Panel (Passcode Protected: Default `Ramesh1234`)
- **Live Occupancy Monitoring**:
  - Real-time count of students currently in the pool.
  - Capacity progress bar against maximum pool limit.
  - Active swimmers list with Room No, Entry Time, Elapsed Time, and Overdue alert flags.
  - One-click **"Mark as Exited"** button for any student or **"Check Out All"** when closing.
- **Configurable Operating Hours (Morning to Evening)**:
  - Change **Opening Time** (default: `06:00 AM`) and **Closing Time** (default: `05:30 PM`).
  - Outside operating hours, check-ins are locked and students see a clear "Pool Closed" notice with the next opening time.
  - Manual override switch for cleaning/weather closures.
- **Session Duration Limit**:
  - Set custom time limit per swim session (e.g., 30m, 45m, 60m, 90m).
- **Entry & Exit Audit History**:
  - Searchable logs by Student Name, Room No, or ID.
  - Filter by Active vs Exited entries.
  - **Export to CSV** button to download spreadsheets anytime.

### 3. 📊 Direct Google Sheets Integration
- Real-time automatic sync of all entries and exits into a Google Sheet.
- Zero server database needed; uses standard Google Apps Script Webhook.
- Includes step-by-step 1-minute setup guide directly in the Warden panel.

### 4. 🔲 QR Code Generator & Printable Entrance Poster
- Live scannable QR code generator inside the app.
- Configurable target URL: paste your live Vercel URL (e.g., `https://your-pool.vercel.app`) to update the QR code.
- **Print Entrance Poster**: Formatted A4 poster ready to print and stick outside the swimming pool gate.

---

## 🚀 Quick Start (Local Development)

```bash
# Navigate to the project directory
cd hostel-pool-system

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ How to Deploy to Vercel

1. Push this `hostel-pool-system` folder to a new GitHub repository:
   ```bash
   cd hostel-pool-system
   git init
   git add .
   git commit -m "Initial commit of Hostel Swimming Pool System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework preset will automatically detect **Vite**.
5. Click **Deploy**!
6. Once deployed, copy your live Vercel URL (e.g., `https://my-hostel-pool.vercel.app`), open the **Warden Panel** or **QR Poster**, and paste it into the URL field.

---

## 📑 1-Minute Google Sheets Setup

1. Open [sheets.new](https://sheets.new) to create a new Google Sheet.
2. In the menu, click **Extensions** > **Apps Script**.
3. Delete the default code, copy the Apps Script template from the **Warden Panel > Google Sheets tab**, and paste it in.
4. Click **Deploy** > **New deployment**.
5. Select type: **Web app**.
6. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` (essential for webhooks)
7. Click **Deploy**, authorize permissions, and copy the **Web App URL**.
8. Paste that URL into the Warden Panel's Google Sheets field and click **Save URL**. Done!
