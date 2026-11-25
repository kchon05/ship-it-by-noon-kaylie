# Cafe finder database

The app stores its data in the database named by `DB_NAME` in the project-root `.env` file.

## Tables

- `Neighborhood` stores the three starting areas and approximate neighborhood-center coordinates.
- `Cafe` stores cafe names, addresses, coordinates, websites, and OpenStreetMap source links. `neighborhood_id` is a foreign key to `Neighborhood`.
- `CafeStudyProfile` holds optional menu, vibe, seating, outlet, and restroom details. Its primary key is also a foreign key to `Cafe`, so each cafe can have at most one profile.
- `CafeCrowdLevel` holds optional busy percentages by cafe, weekday, and time period. Its composite primary key prevents duplicate time slots.
- `CafeTransit` holds optional transit modes and travel-time details for each cafe.

The loader creates the tables and inserts 20 named cafes from Capitol Hill, the University District, and Fremont. Cafe names, map points, and available website links are attributed to OpenStreetMap; see the ODbL attribution at the bottom of the app. Loading is safe to repeat: neighborhoods and cafes are matched by name and OpenStreetMap reference.

Crowd patterns, transit options, menus, vibes, restroom availability, and outlets are not supplied by the source data. Those tables start empty and the app labels the details as unavailable rather than guessing.

## Run

From the project root, connect to UW Wi-Fi or Husky OnNet, then run:

```sh
npm run create-db
npm run check
npm run load
npm start
```

If you already created your database, you can skip `npm run create-db`. Open <http://localhost:3000> after `npm start`. `db/queries.sql` is the parameterized query used by `GET /api/cafes?neighborhood=...`; it orders the cafes by approximate straight-line distance from the selected neighborhood center, not by walking or transit route.
