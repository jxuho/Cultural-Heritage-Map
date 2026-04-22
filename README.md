# 🏛️ Cultural Heritage Map (Solo Project)

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://cultural-heritage-map.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Render-blue?style=flat-square&logo=render)](https://cultural-heritage-map.onrender.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

Discover and explore Chemnitz's cultural heritage sites with an interactive map. Built as a full-stack web application with user authentication, admin workflows(RBAC), and real-time data integration.

---
### 🔗 **[Live Demo](https://cultural-heritage-map.vercel.app/)**

> ⚠️ **Note:** The backend is hosted on Render's free tier. If the site is idle, the server "sleeps." Please allow **30–60 seconds** for the initial load while the backend wakes up.

---

### Main Map View
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/c0940d74-3b77-4aca-adc2-e4e600b030be" /> 
<br>
<br>
<br>
<br>
<details>
<summary><b>📸 More Screenshots</b></summary>  
  
**Admin Dashboard**
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/f3827a95-f97f-44f8-8a46-b5e98e4f492e" />

**User Management Panel (admin)**
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/ad95fb98-3b79-4b38-a7ef-06033aa58650" /> 

**User Dashboard**
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/56fd43b2-ac40-40cc-b5a1-f2fc0c1cf25b" />

**Suggest New Place (user)**
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/dc83060b-02a3-4361-8d20-e8a3fde27294" />
<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/50b90ace-81ab-4281-a7c5-5c3c2f6f2b0c" />

**Manage Suggestion (admin)**
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/76b314c1-c88e-4d16-bd4d-55d5e4db3656" />


**Mobile View**
<img width="390" height="420" alt="image" src="https://github.com/user-attachments/assets/42141d64-9d47-468c-8573-254adbafca14" />

</details>

<br>
<br>

---

## ✨ Key Features

* 🗺️ **Explore Cultural Heritage** - Discover 500+ historic sites in Chemnitz with interactive mapping and real-time data from OpenStreetMap
* 🔐 **Role-Based Access Control** - Different permissions for users and administrators to manage content safely
* 👤 **Social Authentication** - Quick login with Google OAuth 2.0, no password needed
* 📱 **Fully Responsive** - Works seamlessly on mobile, tablet, and desktop devices
* ✅ **Auto-Updated Data** - Weekly automatic sync with OpenStreetMap keeps information current
* 🎯 **Admin Dashboard** - Manage users, review proposals, and moderate site submissions

---

## 🛠️ Tech Stack

### **Frontend**
- React 19, Vite, TypeScript, TanStack Query, Zustand, Tailwind CSS, Leaflet

### **Backend**
- Node.js, Express, MongoDB Atlas, Passport.js (JWT + OAuth 2.0)

### **Deployment**
- Frontend: Vercel | Backend: Render | Database: MongoDB Atlas

---
## 📚 Project Context

**TU Chemnitz "Datenbanken und Web-Techniken" Coursework (Grade: 1.0)** 

Started as a university assignment but significantly extended beyond course requirements with:
- **RBAC Implementation** - Multi-role permission system for users and administrators
- **Production Deployment** - Full-stack setup with Vercel (Frontend) + Render (Backend)
- **API Documentation** - OpenAPI/Swagger specification for all endpoints
- **Advanced Authentication** - Secure JWT + OAuth 2.0 integration with httpOnly cookies
- **Geospatial Integration** - Real-time data sync from Overpass API with batch processing
- **Database Design** - MongoDB replica sets for transaction support in concurrent workflows

---
## 🚧 Current Development

- 🔄 **TypeScript Migration:** 60% complete - converting React components and Express routes for type safety and scalability
- 🌍 **Berlin Support:** Extending geospatial architecture to support multiple German cities


---
## 🎯 Key Technical Learnings

- **GIS & Mapping:** Integrated Overpass API and Leaflet for efficient geospatial data handling
- **Authentication:** Implemented JWT + OAuth 2.0 flow with security best practices (httpOnly cookies)
- **Full-Stack Architecture:** Designed decoupled frontend/backend deployment for optimal user experience
- **Database Design:** Used MongoDB replica sets for transaction support in multi-user workflows
- **DevOps:** Automated data sync with cron jobs and implemented production monitoring

---

## 💻 Local Development

<details>
<summary>Click to expand setup instructions</summary>

### 1. Environment Variables
Create a `.env` file in the `/backend` directory:
```env
MONGO_URI=your_mongodb_atlas_uri
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=/api/v1/auth/google/callback
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=dev
```

### 2. Installation
```
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd backend && npm install
```

### 3. Initialize Database
```
cd backend
# Fetch data from Overpass API
node scripts/fetchAndSaveCulturalSites.js
# Import to MongoDB
node scripts/importGeojson.js --no-reverse-geocode
```
### 4. Run Servers
```
# Frontend
cd frontend && npm run dev (Runs on http://localhost:3000)

# Backend
cd backend && npm start (Runs on http://localhost:5000)
```
</details>

## 📄 API Specification
- **Interactive API Docs:** [Swagger UI](https://cultural-heritage-map.onrender.com/api-docs/)
- **OpenAPI Spec:** Available at `/api-docs/` endpoint
