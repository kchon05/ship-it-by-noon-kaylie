const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sql = require('mssql');

const databaseName = process.env.DB_NAME || '';
const requiredSettings = ['DB_SERVER', 'DB_USER', 'DB_PASSWORD'];
const missingSettings = requiredSettings.filter((key) => !process.env[key]);

const neighborhoods = [
  { name: 'Capitol Hill', latitude: 47.6187, longitude: -122.3216 },
  { name: 'University District', latitude: 47.6586, longitude: -122.3131 },
  { name: 'Fremont', latitude: 47.6515, longitude: -122.3500 },
];

const cafes = [
  {
    name: 'Analog Coffee',
    neighborhood: 'Capitol Hill',
    address: '235 Summit Avenue East',
    latitude: 47.620726,
    longitude: -122.325462,
    website: 'https://analogcoffee.com',
    osmRef: 'node/2158667407',
  },
  {
    name: 'Anchorhead Coffee',
    neighborhood: 'Capitol Hill',
    address: '1115 12th Avenue',
    latitude: 47.612024,
    longitude: -122.316993,
    website: 'https://anchorheadcoffee.com/',
    osmRef: 'node/3511071062',
  },
  {
    name: 'Caffe Ladro',
    neighborhood: 'Capitol Hill',
    address: '435 15th Avenue East',
    latitude: 47.622988,
    longitude: -122.312817,
    website: 'https://caffeladro.com/',
    osmRef: 'node/1726737132',
  },
  {
    name: 'Caffe Vita',
    neighborhood: 'Capitol Hill',
    address: '1005 East Pike Street',
    latitude: 47.613867,
    longitude: -122.319051,
    website: 'https://www.caffevita.com/',
    osmRef: 'way/206624488',
  },
  {
    name: 'Espresso Vivace',
    neighborhood: 'Capitol Hill',
    address: '532 Broadway East',
    latitude: 47.623801,
    longitude: -122.320744,
    website: 'https://espressovivace.com/retail/brix/',
    osmRef: 'node/2131717376',
  },
  {
    name: 'Ghost Note Coffee',
    neighborhood: 'Capitol Hill',
    address: '1623 Bellevue Avenue',
    latitude: 47.615926,
    longitude: -122.327032,
    website: 'https://ghostnotecoffee.com',
    osmRef: 'node/4243769089',
  },
  {
    name: 'Victrola Coffee Roasters',
    neighborhood: 'Capitol Hill',
    address: '411 15th Avenue East',
    latitude: 47.622352,
    longitude: -122.312829,
    website: 'https://www.victrolacoffee.com/pages/15th',
    osmRef: 'node/1539274998',
  },
  {
    name: 'Ancient Gate Coffee Company',
    neighborhood: 'University District',
    address: '4530 University Way Northeast',
    latitude: 47.662215,
    longitude: -122.312937,
    website: 'https://www.ancientgatecoffee.com/',
    osmRef: 'node/12847612701',
  },
  {
    name: 'Avole',
    neighborhood: 'University District',
    address: '4555 University Way Northeast',
    latitude: 47.662870,
    longitude: -122.313280,
    website: 'https://avolecoffee.com/',
    osmRef: 'node/2323794557',
  },
  {
    name: 'Cafe Allegro',
    neighborhood: 'University District',
    address: null,
    latitude: 47.658693,
    longitude: -122.312716,
    website: 'https://seattleallegro.com/',
    osmRef: 'node/1888703358',
  },
  {
    name: 'Cafe Solstice',
    neighborhood: 'University District',
    address: '4116 University Way Northeast',
    latitude: 47.657410,
    longitude: -122.313057,
    website: null,
    osmRef: 'node/1411682582',
  },
  {
    name: 'Café Happy',
    neighborhood: 'University District',
    address: '1408 Northeast 40th Street',
    latitude: 47.655450,
    longitude: -122.312909,
    website: 'https://cafe-happy.com/',
    osmRef: 'node/2439831123',
  },
  {
    name: 'Café On The Ave',
    neighborhood: 'University District',
    address: '4201 University Way Northeast',
    latitude: 47.658439,
    longitude: -122.313387,
    website: 'http://cafeontheave.com',
    osmRef: 'node/1158383854',
  },
  {
    name: 'Leon Coffee House',
    neighborhood: 'University District',
    address: '1309 Northeast 45th Street',
    latitude: 47.661165,
    longitude: -122.313818,
    website: 'https://www.leoncoffeehouse.com/',
    osmRef: 'node/2323789998',
  },
  {
    name: 'Aroom',
    neighborhood: 'Fremont',
    address: '3801 Stone Way North',
    latitude: 47.653150,
    longitude: -122.342795,
    website: 'https://www.aroomcoffee.com',
    osmRef: 'node/2143317842',
  },
  {
    name: 'Cafe Con Todo',
    neighborhood: 'Fremont',
    address: '213 North 36th Street',
    latitude: 47.652410,
    longitude: -122.356002,
    website: null,
    osmRef: 'node/2144365446',
  },
  {
    name: 'Caffe Vita',
    neighborhood: 'Fremont',
    address: '4301 Fremont Avenue North',
    latitude: 47.659062,
    longitude: -122.350176,
    website: 'https://www.caffevita.com',
    osmRef: 'node/1200781646',
  },
  {
    name: 'Coby’s Cafe',
    neighborhood: 'Fremont',
    address: '101 Nickerson Street',
    latitude: 47.648466,
    longitude: -122.355283,
    website: 'https://cobyscafe.com',
    osmRef: 'node/2812665387',
  },
  {
    name: 'Fremont Coffee Company',
    neighborhood: 'Fremont',
    address: '459 North 36th Street',
    latitude: 47.651707,
    longitude: -122.353076,
    website: 'http://www.fremontcoffee.net/',
    osmRef: 'way/115699732',
  },
  {
    name: 'Lighthouse Roasters',
    neighborhood: 'Fremont',
    address: '400 North 43rd Street',
    latitude: 47.659063,
    longitude: -122.354245,
    website: 'https://www.lighthouseroasters.com',
    osmRef: 'node/1308152010',
  },
];

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function seedNeighborhoods(pool) {
  for (const neighborhood of neighborhoods) {
    await pool.request()
      .input('name', sql.NVarChar(80), neighborhood.name)
      .input('latitude', sql.Decimal(9, 6), neighborhood.latitude)
      .input('longitude', sql.Decimal(9, 6), neighborhood.longitude)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.Neighborhood
          WHERE neighborhood_name = @name
        )
        BEGIN
          INSERT INTO dbo.Neighborhood (neighborhood_name, center_lat, center_lon)
          VALUES (@name, @latitude, @longitude);
        END;
      `);
  }
}

async function seedCafes(pool) {
  const result = await pool.request().query(`
    SELECT neighborhood_id, neighborhood_name
    FROM dbo.Neighborhood;
  `);
  const neighborhoodIds = new Map(
    result.recordset.map((row) => [row.neighborhood_name, row.neighborhood_id])
  );

  for (const cafe of cafes) {
    const neighborhoodId = neighborhoodIds.get(cafe.neighborhood);
    if (!neighborhoodId) {
      throw new Error(`Missing neighborhood row: ${cafe.neighborhood}`);
    }

    await pool.request()
      .input('neighborhoodId', sql.Int, neighborhoodId)
      .input('osmRef', sql.NVarChar(80), cafe.osmRef)
      .input('name', sql.NVarChar(160), cafe.name)
      .input('address', sql.NVarChar(240), cafe.address)
      .input('latitude', sql.Decimal(9, 6), cafe.latitude)
      .input('longitude', sql.Decimal(9, 6), cafe.longitude)
      .input('website', sql.NVarChar(500), cafe.website)
      .input('sourceUrl', sql.NVarChar(500), `https://www.openstreetmap.org/${cafe.osmRef}`)
      .query(`
        IF EXISTS (
          SELECT 1
          FROM dbo.Cafe
          WHERE osm_ref = @osmRef
        )
        BEGIN
          UPDATE dbo.Cafe
          SET
            neighborhood_id = @neighborhoodId,
            cafe_name = @name,
            street_address = @address,
            latitude = @latitude,
            longitude = @longitude,
            website_url = @website,
            source_url = @sourceUrl
          WHERE osm_ref = @osmRef;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.Cafe (
            neighborhood_id,
            osm_ref,
            cafe_name,
            street_address,
            latitude,
            longitude,
            website_url,
            source_url
          )
          VALUES (
            @neighborhoodId,
            @osmRef,
            @name,
            @address,
            @latitude,
            @longitude,
            @website,
            @sourceUrl
          );
        END;
      `);
  }
}

async function main() {
  if (!/^[A-Za-z][A-Za-z0-9_]*_myapp$/.test(databaseName)) {
    throw new Error('Set DB_NAME in .env to your own <NetID>_myapp database.');
  }
  if (missingSettings.length > 0) {
    throw new Error(`Missing required .env setting(s): ${missingSettings.join(', ')}`);
  }

  let pool;
  try {
    pool = await sql.connect({
      server: process.env.DB_SERVER,
      port: Number(process.env.DB_PORT || 1433),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: databaseName,
      options: { encrypt: true, trustServerCertificate: true },
    });

    await pool.request().query(schema);
    await seedNeighborhoods(pool);
    await seedCafes(pool);

    console.log(`Database schema is ready. Checked ${cafes.length} real cafe listings from OpenStreetMap.`);
    console.log('Crowd, transit, menu, vibe, restroom, and outlet details remain blank until verified.');
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

main().catch((error) => {
  console.error('Database load failed:', error.message);
  console.error('Check your .env settings and connect to UW Wi-Fi or Husky OnNet.');
  process.exitCode = 1;
});
