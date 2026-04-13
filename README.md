### **Live Demo:** [Click here](https://chemnitz-cultural-sites.onrender.com/)
> ⚠️ **Note:** The server is hosted on Render's free tier and may take **up to 1 minute to wake up** on the first load.


🚧 Ongoing Progress:
Currently migrating the entire codebase to TypeScript and adding Berlin data support in the feature/typescript-migration branch.



# How to initialize Database and Application

### 1. Create `.env` file at `/backend` directory

##### .env example

```
MONGO_URI=mongodb+srv://id:password@cluster0.ssh0lrs.mongodb.net/dbw
GOOGLE_CLIENT_ID=12345678900-EXAMPLE_VALUE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-Gm2r-EXAMPLE_VALUE

PORT=5000
GOOGLE_CALLBACK_URL=/api/v1/auth/google/callback
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
NODE_ENV=dev
```
##### **Note**
- `MONGO_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` must be changed to own value.
- To obtain the `MONGO_URI`, you need to configure MongoDB
    - Given that MongoDB transactions are being utilized, in a local environment, it is necessary to configure your MongoDB instance as a replica set. Or opt for a cloud-hosted MongoDB service such as MongoDB Atlas (**recommended**).

- To obtain `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, you need to access https://console.cloud.google.com/ and create OAuth 2.0 client in a project.
    - The authorized JavaScript origin should be set to http://localhost:3000 (set in `/frontend/vite.config.js`), and the authorized redirect URI should be http://localhost:5000/api/v1/auth/google/callback (set in `/backend/.env` PORT and GOOGLE_CALLBACK_URL).
    - If you change the URIs above, you need to be careful about dependencies.

### 2. Install Packages

1. Move to `/frontend` 
2. Run `npm install`
3. Move to `/backend`
4. Run `npm install`

### 3. Initialize the Database

A script to initialize the database is located in the source code.
The explanation below assumes use of a CLI and assumes a MongoDB database exist.

1.  Move to `/backend`

2.  Run `node scripts/fetchAndSaveCulturalSites.js`
    - This script fetch cultural site data from Overpass API.
    - Data will be saved in `/backend/data`

3.  Run `node scripts/importGeojson.js --no-reverse-geocode` 
    - This script import the newest `chemnitz_cultural_sites_[time].geojson` saved in `/backend/data` and convert it into CulturalSite schema, and load it into the database.
    - Check culturalsites collection in your database.
        
    ##### **Note**
    importGeojson.js basically performs reverse-geocoding using the Nominatim API for any of the hundreds of items in the geojson that do not have an addr tag specified. This process can take several minutes.
    This process had to be done because the address field in culturalSiteSchema (`/backend/models/CulturalSite.js`) was set to `required: true`.
    However, for faster database setup, `required: true` is currently commented out.
    To perform reverse geocoding, you can run `node scripts/importGeojson.js`. This script loads the geojson file into the database with performing reverse geocoding, and this is the original logic of the app.



### 4. Run Servers
1. Move to `/frontend` 
2. Run `npm run dev`
3. Open a New Terminal
4. Move to `/backend`
5. Run `npm start`

### 5. Access to the Browser
1. Open a Browser
2. Enter http://localhost:3000/ in the address bar.

    ##### **Note**
    When initially signing up via Google OAuth, the role is defaulted to 'user'. However, for a smoother functional review, it was temporarily set to 'admin'.
    (`/backend/models/User.js` 'role' field default value was set to 'admin' currently.)
    Since the app behaves differently when the role is 'user' and when it is 'admin' (my-account page, proposals), the case when the role is 'user' should also be checked. 
    To do this, the role can be changed in another account with the role set to 'admin' to 'user' at http://localhost:3000/my-account/users, but there's simpler way to change the value of the role field in the database users collection to 'user' manually.
    


---

# OpenAPI Specification
- The OpenAPI Specification is located at `/backend/public/openapi.yaml`.
- Since it is hosted in the backend by the swagger-ui-express library, you can access the OpenAPI document via http://localhost:5000/api-docs/.
