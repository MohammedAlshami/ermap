# JSON data listing

Summary of data in the project’s main JSON files.

---

## 1. `public/data-mapping.json`

Maps dataset keys to R2 and describes structure. Contains:

- **malaysia.geojson** – Malaysia (country), GeoJSON  
- **education_centers_malaysia** – Education Centers Malaysia, GeoJSON (points + polygons)  
- **family_mart** – Family Mart stores, GeoJSON (points: name, address, state, operating_hour)  
- **power_data** – Power data (towers, substations, plants), GeoJSON (mixed geometry)  
- **global_landslide_catalog** – NASA COOLR landslide events, GeoJSON (points)  
- **malaysia_district** – Malaysia districts, GeoJSON (no r2Key; local path)  
- **Statistics:** tourism, water_scarcity, population_density (JSON)  
- **Hotels:** sabah_hotels, GeoJSON  
- **Raster:** oso_landslide_tiff (TIFF, Oso mudslide)  
- **Speedmart:** sabah_speedmart, GeoJSON  

---

## 2. `public/companies.json`

| id | name | description |
|----|------|--------------|
| a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d | 99 Speedmart | Malaysia's largest mini market retail chain. Stock: 5296.KL |
| b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e | Mr. DIY | Always low prices. Home improvement retailers. Stock: 5297.KL |
| c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f | Foodie Media | #1 Digital Food Media in Southeast Asia. |
| d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a | Life Water | Life Water Industries Sdn Bhd. Quality beverages. |
| e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b | Family Mart | Convenience store chain. storeLocationsUrl, menuUrl. |

---

## 3. `public/data/malaysia/statistics/tourism.json`

- **visitor_arrivals**  
  - period: January–November 2025  
  - total_arrivals: 3,365,149  
  - domestic_arrivals: 2,025,220  
  - international_arrivals: 1,339,929  
  - total_tourism_receipts_rm_billion: 7.77  
  - growth_rates: total 18.2%, domestic 18.7%, international 17.3%, tourism_receipts 17.9%

- **arrivals_yearly_breakdown (years)**  
  - 2019: 4.2M | 2020: 0.37M | 2021: 0.07M | 2022: 1.7M | 2023: 2.8M | 2024: 3.1M | 2025: 3.4M  

- **receipts_yearly_breakdown (years, RM billion)**  
  - 2019: 9.02 | 2020: 0.8 | 2021: 0.6 | 2022: 4.33 | 2023: 5.76 | 2024: 7.28 | 2025: 7.77  

- **weekly_flight_frequency_and_seat_capacity** (effective 01.01.2026)  
  - international: 163 flights, 30,189 seats, 12 airlines, 15 destinations  
  - domestic: 499 flights, 85,710 seats, 5 airlines, 13 destinations  

- **sabah_hotel_room_supply**  
  - 5_star: 13 hotels, 3,427 rooms  
  - 4_star: 16 hotels, 2,296 rooms  
  - 3_star: 54 hotels, 4,785 rooms  
  - 2_star: 38 hotels, 1,913 rooms  
  - 1_star: 35 hotels, 1,375 rooms  
  - orchid_1/2/3, no_rating  
  - grand_total: 685 hotels, 26,822 rooms  

- **sabah_hotel_occupancy_jan_sep_2025**  
  - overall: 60.2% | 5_star: 70.8% | 4_star: 61.5% | 3_star: 60.6% | 2_star_and_below: 39.9%  

---

## 4. `public/data/malaysia/statistics/water_scarcity.json`

Array of state-level water access and scarcity:

| state | water_access_percent | water_scarcity_percent |
|-------|----------------------|------------------------|
| Kelantan | 73.9 | 26.1 |
| Sabah | 80.5 | 19.5 |
| Sarawak | 83.7 | 16.3 |
| Terengganu | 96.0 | 4.0 |
| Pahang | 98.0 | 2.0 |
| Kedah | 98.3 | 1.7 |
| Perlis | 99.5 | 0.5 |
| Perak | 99.6 | 0.4 |
| Selangor | 99.8 | 0.2 |
| Johor | 99.9 | 0.1 |
| Pulau Pinang | 99.9 | 0.1 |
| Negeri Sembilan | 99.9 | 0.1 |
| Melaka | 100.0 | 0.0 |
| WP Labuan | 100.0 | 0.0 |
| WP Kuala Lumpur | 100.0 | 0.0 |
| WP Putrajaya | 100.0 | 0.0 |

---

## 5. `public/data/malaysia/statistics/population_density.json`

Array of state-level population density (people per km²):

| state | people_per_km2 |
|-------|----------------|
| Kuala Lumpur (W.P.) | 8,157 |
| Putrajaya (W.P.) | 2,374 |
| Penang | 1,688 |
| Selangor | 879 |
| Malacca | 604 |
| Perlis | 358 |
| Kedah | 226 |
| Johor | 211 |
| Negeri Sembilan | 181 |
| Kelantan | 119 |
| Perak | 119 |
| Terengganu | 89 |
| Sabah | 46 |
| Pahang | 44 |
| Sarawak | 20 |

---

## 6. `public/data/malaysia/family_mart_menu.json`

Structure: `{ "categories": [ { "name": string, "items": [ { "name": string, "price": string } ] } ] }`

**Categories (sample):**

- **Bento** – e.g. Golden Salted Egg Macaroni & Cheese (1s) RM16.20  
- **Bread** – e.g. Pizza Sausage Bun, Triple Chocolate Melon Pan, Butter Sugar Bun, etc.  
- **Coffee** – e.g. Iced Latte RM8.30, Iced Caramel Latte RM9.50, Large Hot Cappuccino, etc.  
- **Desserts & Cakes** – e.g. Mango Sando, Mochi Puff, Cream Puff, Chocolate Mousse, etc.  
- **Collection Tea** – (more items)  
- … additional categories with name + items (name, price).

Full file has many categories and items; browse at `/data/malaysia/family_mart_menu.json`.

---

## 7. GeoJSON files (referenced in data-mapping)

- **my.json** – Malaysia state boundaries (MultiPolygon).  
- **malaysia.district.geojson** – District boundaries (path in app: `/data/malaysia/geojson/malaysia.district.geojson`).  
- **sabah_hotels.geojson** – Point features: name, location, address, rooms, status, hotel_type.  
- **sabah_speedmart.geojson** – Point features: name, address, district, state, latitude, longitude.  

Actual GeoJSON content is large; use the Data page or `/data/$id` to explore by dataset.
