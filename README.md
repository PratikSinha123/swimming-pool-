# 🏊 Hostel Swimming Pool Entry & Management System

A modern, mobile-friendly, QR-code-based swimming pool entry and management system designed for hostel students and wardens.

Built with **React 19**, **Vite**, **Tailwind CSS**, and **TypeScript**, ready for **1-click Vercel deployment** with automatic **instant cross-device cloud sync**.

---

## 🌟 Key Features

### 1. 📱 Student Mobile Check-In (Scanned via QR Code)
- **Instant Scan & Enter**: Students scan the QR code posted at the pool entrance using their smartphone camera.
- **Ultra-Fast Entry Form**:
  - Student Full Name
  - Hostel Room Number (e.g., `Room 204` or `B-102`)
  - Entry timestamp is captured automatically down to the second.
- **Strict Closure & Meal Interval Enforcement**:
  - Automatically locks form submissions outside operating hours and during configured meal breaks.

### 2. 🛡️ Warden Admin Panel (Passcode Protected: Default `Ramesh1234`)
- **Real-Time Cross-Device Sync**:
  - Cloud database automatically syncs entries and pool hours across all phones, tablets, and computers.
- **Configurable Operating Hours & Meal Breaks**:
  - Change opening & closing hours with instant propagation to all devices.
  - Configure meal break intervals (Breakfast, Lunch, Snacks, Dinner).
- **Entry Records & Audit**:
  - Searchable by Student Name or Room Number.
  - Filter by today's entries or all-time logs.
  - **Export CSV** button to download attendance records anytime.
  - One-click **Clear Records** button to reset entries when needed.

### 3. 🔲 QR Code Generator & Printable Entrance Poster
- Live scannable QR code generator inside the app.
- Print entrance poster directly formatted for A4 paper.

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

1. Push this `hostel-pool-system` folder to your GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework preset will automatically detect **Vite**.
5. Click **Deploy**!
