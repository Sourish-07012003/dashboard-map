# 🗺️ Interactive Polygon-Based Data Dashboard

A React + Leaflet-based web application that allows users to draw, edit, and analyze polygons on a map with associated dataset visualization and time filtering.

---

## 🚀 Live Deployment

**🔗 [Live Demo](https://dashboard-mapp.vercel.app/)**  

---

## 📂 GitHub Repository

**🔗 [GitHub Repo](https://github.com/Sourish-07012003/dashboard-map)**  

---

## 🛠️ Setup and Run Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Sourish-07012003/dashboard-map.git
cd dashboard-map
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

---

## 📦 Summary of Libraries Used

| Library                 | Purpose                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| `react-leaflet`         | Map rendering and interaction                                           |
| `leaflet-draw`          | Polygon drawing and editing tools                                       |
| `antd`                  | UI components and layout                                                |
| `zustand`               | Lightweight state management                                            |
| `axios`                 | API requests                                                            |
| `dayjs`                 | Time formatting                                                         |
| `uuid`                  | Unique polygon ID generation                                            |
| `vite`                  | Development and bundling                                                |
| `typescript`            | Type-safe development                                                   |

---

## ✅ Features Implemented

### ✅ Step 1: Time Range Slider
- Range-based slider with hour selection.
- Caches API responses for performance.
- Persists selected range in session.

### ✅ Step 2 & 3: Polygon Drawing & Management
- Users can draw, edit, and rename polygons.
- Persistent polygon data across reloads.
- Edit and remove polygons with proper validation.
- Feature limits (min 3, max 12 points) enforced.

### ✅ Step 4: Data Visualization
- Polygons colored based on active rule threshold.
- Interactive legend and field selection.
- Dataset comparison & multi-field selection supported.

### ✅ Bonus Enhancements
- Tooltip info on hover.
- Polygon rename/edit/delete UX improved.
- Local storage caching.
- Smooth color transitions (optional).
- Basic error handling on API/data fetch failure.

---

## 💡 Design / Development Remarks

- **Polygon Matching:** Uses stable IDs for syncing edits.
- **UI/UX Enhancements:** Refined with `antd`, ensuring consistent experience.
- **Performance:** Uses memoization & localStorage caching for data fetches.
- **Extendability:** Designed to support additional datasets and rule types easily.

---
Made By Sourish Panja
