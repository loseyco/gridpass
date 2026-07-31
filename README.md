# 🏎️ Gridpass — Universal Vehicle Network & Modular Business Engine

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Vanilla-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Release](https://img.shields.io/badge/Release-v4.1.0-red?style=flat-square)](https://github.com/loseyco/gridpass/releases)

Gridpass is a high-performance, full-stack web application and modular SaaS platform engine built for the motorsport, automotive, and local business ecosystem (Food Trucks, Auto Shops, Race Teams, Track Venues, and Marine Parks).

---

## 🌟 Key Platform Modules

- **👤 Member & Driver Identity Passports (`/members`, `/u/[id]`)**: Universal public online resume cards, licensing badges, dynamic QR passes, and vehicle garages.
- **🏎️ Vehicle Passports & Garages (`/vehicles`, `/v/[id]`)**: Unlimited vehicle profiles with specs, service logs, photo galleries, and downloadable dynamic QR tags.
- **🍔 Food Truck Paddock Engine (`/b/[id]`)**: Live digital paddock menus, real-time item availability toggles, express mobile pickup queues, and catering vouchers.
- **💼 Sales CRM & Prospect Intake (`/admin/crm`)**: 4-Step guided intake stepper for sales teams that creates Member Profiles, Business Entities, Client Proposals, and CRM Deal records in 1 automated workflow.
- **📦 Products & Industries Catalogs (`/admin/products`, `/admin/industries`)**: Centralized catalog management for modular software features, pricing models, development statuses, and industry verticals.

---

## 🛠️ Architecture & Tech Stack

```
[ Frontend: Next.js 16 (App Router) + TypeScript + TailwindCSS ]
                           │
                           ▼
[ Backend & Realtime State: Firebase Firestore + Cloud Auth ]
                           │
                           ▼
[ Security & Telemetry: Firestore Rules Invariant Engine ]
```

- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript 5.0+
- **Database & Auth**: Google Cloud Firestore & Firebase Auth
- **E2E Testing**: Playwright Test Suite (`node run-tests.js`)
- **Version Control**: Git & GitHub with Feature Branching, SemVer Release Tags, and PR Templates

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18.0.0+`
- npm `v9.0.0+`

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/loseyco/gridpass.git
cd gridpass

# Install dependencies
npm install

# Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the automated Playwright E2E suite:
```bash
npm run build
node run-tests.js
```

---

## 📄 License & Ownership
Copyright © 2026 Gridpass Operations. All Rights Reserved.
