
---

# **Geospatial Shapefile Viewer**  
**Angular (Frontend) + .NET API (Backend) + SQL Server (Database)**  

This application allows users to:  
✅ Upload Shapefiles (`.shp` + `.prj`) in **WGS84 (EPSG:4326)**  
✅ View uploaded geometries on a map  
✅ Zoom to features & edit labels  
✅ Draw new polygons/polylines  

---

## **🚀 Setup & Installation**  

### **1️⃣ Backend (.NET API) Setup**  
#### **Prerequisites**  
- [.NET 8.0+ SDK](https://dotnet.microsoft.com/download)  
- SQL Server

#### **Steps**  
1. **Install required libraries** (run in `/backend` folder):  
   ```sh
   dotnet restore
   ```

2. **Configure `appsettings.json`**  
   Update the connection string:  
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER;Database=GeoAppDb;Trusted_Connection=True;"
   }
   ```

3. **Run EF Core Migrations**  
   ```sh
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. **Start the API**  
   ```sh
   dotnet run
   ```
   - API runs at `https://localhost:5001` (or `http://localhost:7284`)  

---

### **2️⃣ Frontend (Angular) Setup**  
#### **Prerequisites**  
- [Node.js](https://nodejs.org/) (v20)  
- Angular CLI (`npm install -g @angular/cli`)  

#### **Steps**  
1. **Install dependencies** (run in `/frontend` folder):  
   ```sh
   npm install
   ```

2. **Configure `environment.ts`**  
   Update the API URL:  
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://localhost:7284/api'  // Match your .NET API URL
   };
   ```

3. **Start the Angular app**  
   ```sh
   ng serve
   ```
   - App runs at `http://localhost:4200`  

---

## **🖥️ How to Use the App**  

### **1. Upload a Shapefile**  
- **Only WGS84 (EPSG:4326)** Shapefiles are supported.  
- Upload **both `.shp` and `.prj`** files at the same time.  
- After upload, the **Shapefile table** updates automatically.  

### **2. View & Interact with Geometries**  
- **Click a Shapefile** → Shows all geometries on the map.  
- **Click a row in the Geometries table** → Zooms to that feature.  
- **Click a geometry on the map** → Opens a popup to **edit its label**.  

### **3. Drawing Tools**  
- **Draw polygons/polylines** using the toolbar.  
- **Finish a sketch** by:  
  - **Right-click**  
  - **Double left-click**  
- After finishing, a popup appears to **add a label**.  

---

## **⚠️ Troubleshooting**  
| Issue | Solution |  
|-------|----------|  
| **Shapefile upload fails** | Ensure `.shp` and `.prj` are uploaded together. |  
| **API not reachable** | Check `environment.ts` and CORS settings in `.NET API`. |  
| **Migrations fail** | Verify SQL Server connection string in `appsettings.json`. |  

---

## **📂 Project Structure**  
```
/backend       → .NET API (C#)  
/frontend      → Angular (TypeScript)  
/Shapefiles    → Sample uploads 
```

---

## **🔧 Technologies Used**  
- **Frontend**: Angular 20, CesiumJS
- **Backend**: .NET 8, EF Core, NetTopologySuite  
- **Database**: SQL Server

---

**🎉 Ready to go!** Run both the API (`dotnet run`) and Angular app (`ng serve`), then start uploading Shapefiles.  

--- 
