-- Optional flag to only seed recent data (last month, this month, next month)
\if :{?RECENT_ONLY}
\else
  \set RECENT_ONLY 0
\endif

-- Makes sure the random values are the same every time we run the script
SELECT setseed(0.424242);

-- User ID variables
\set OLA_ID '12345678-1234-5678-1234-567812345678'
\set KARI_ID '87654321-8765-4321-8765-432187654321'
\set PER_ID 'aaa3801e-f3ff-4b0c-9692-56e7505e9c31'
\set TROND_ID 'bbb3801e-f3ff-4b0c-9692-56e7505e9c31'
\set GJERTRUD_ID 'ccc3801e-f3ff-4b0c-9692-56e7505e9c32'
\set KLARA_ID 'ccc3801e-f3ff-4b0c-9692-56e7505e9c33'
\set BIRGIR_ID 'ddd3801e-f3ff-4b0c-9692-56e7505e9c31'
\set TORLEIF_ID 'eee3801e-f3ff-4b0c-9692-56e7505e9c31'
\set BJØRNULF_ID 'fff3801e-f3ff-4b0c-9692-56e7505e9c31' 

\set DEFAULT_PASSWORD_HASH '$2a$11$QXVHkr6TQC8gJvh5P4GFzOYc.HyZA3FxDC3/BghAM3hODQVAoWwwi' -- hashed 'password123'

-- Location ID variables
\set VERDAL_ID '11111111-1111-1111-1111-111111111111'
\set SANDSLI_ID '22222222-2222-2222-2222-222222222222'

-- Delete existing data to avoid duplicates when reseeding
DELETE FROM "User";
DELETE FROM "Location";

-- Location
INSERT INTO "Location" ("Id", "Latitude", "Longitude", "Country", "Region", "City", "Site", "Building")
VALUES 
    (:'VERDAL_ID', 63.78788207165566, 11.440749156413084, 'Norway', 'Trøndelag', 'Verdal', 'Aker Solutions Verdal', 'Bygg 1'),
    (:'SANDSLI_ID', 60.29278334510331, 5.279473042646057, 'Norway', 'Bergen', 'Bergen', 'Aker Solutions Sandsli', NULL);

-- User
INSERT INTO "User" ("Id", "Username", "Email", "PasswordHash", "CreatedAt", "JobDescription", "LocationId", "Role")
VALUES 
    (:'OLA_ID', 
    'Ola Nordmann', 
    'ola.nordmann@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Formann for bygg 1',
    :'VERDAL_ID',
    'Foreman'),
    (:'KARI_ID',
    'Kari Nordmann',
    'kari.nordmann@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Sveiser',
    :'SANDSLI_ID',
    'Operator'),
    (:'PER_ID',
    'Per Hansen',
    'per.hansen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'),
    (:'TROND_ID',
    'Trond Pedersen',
    'trond.pedersen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'),
    (:'GJERTRUD_ID',
    'Gjertrud Olsen',
    'gjertrud.olsen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'),
    (:'KLARA_ID',
    'Klara Johansen',
    'klara.johansen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'), 
    (:'BIRGIR_ID',
    'Birgir Sigurdsson',
    'birgir.sigurdsson@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'),
    (:'TORLEIF_ID',
    'Torleif Eriksen',
    'torleif.eriksen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator'),
    (:'BJØRNULF_ID',
    'Bjørnulf Knutsen',
    'bjornul.knutsen@aker.com',
    :'DEFAULT_PASSWORD_HASH',
    NOW(),
    'Technician',
    :'SANDSLI_ID',
    'Operator');

-- UserManagers
INSERT INTO "UserManagers" ("ManagersId", "SubordinatesId")
VALUES
    (:'OLA_ID', :'KARI_ID'),
    (:'OLA_ID', :'PER_ID'),
    (:'OLA_ID', :'TROND_ID'),
    (:'OLA_ID', :'GJERTRUD_ID'),
    (:'OLA_ID', :'KLARA_ID'),
    (:'OLA_ID', :'BIRGIR_ID'),
    (:'OLA_ID', :'TORLEIF_ID'),
    (:'OLA_ID', :'BJØRNULF_ID');


-- Randomized multiplier and jitter values for each user and sensor for fixtures
DROP TABLE IF EXISTS seed_user_profile;
CREATE TEMP TABLE seed_user_profile (
  user_id uuid PRIMARY KEY,
  mult_noise double precision,
  jit_noise  double precision,
  mult_dust  double precision,
  jit_dust   double precision,
  mult_vib   double precision,
  jit_vib    double precision
);

INSERT INTO seed_user_profile (user_id, mult_noise, jit_noise, mult_dust, jit_dust, mult_vib, jit_vib)
SELECT
    u,
  -- Noise
  (0.85 + random() * (1.25 - 0.85)),
  (0.30 + random() * (1.50 - 0.30)),
  -- Dust
  (0.05 + random() * (0.30 - 0.05)),
  (0.02 + random() * (0.12 - 0.02)),
  -- Vibration
  (0.60 + random() * (2.20 - 0.60)),
  (0.10 + random() * (0.80 - 0.10))

-- We don't include Kari in the randomization, as she should have the original values from the CSVs
FROM (VALUES
    (:'PER_ID'::uuid),
    (:'TROND_ID'::uuid),
    (:'GJERTRUD_ID'::uuid),
    (:'KLARA_ID'::uuid),
    (:'BIRGIR_ID'::uuid),
    (:'TORLEIF_ID'::uuid),
    (:'BJØRNULF_ID'::uuid)
) AS t(u);


-- NOISE DATA

TRUNCATE TABLE "NoiseData" RESTART IDENTITY CASCADE;

-- Create temporary table matching ALL CSV columns
CREATE TEMP TABLE temp_noise_data (
    Time TIMESTAMP,
    LCPK DECIMAL,
    LAEQ DECIMAL,
    LZPK DECIMAL,
    "LAVG (Q5)" DECIMAL,
    LCEQ DECIMAL,
    LAFmax DECIMAL,
    LASmax DECIMAL,
    "LAVG (Q3)" DECIMAL,
    Motion INTEGER,
    MotionSeries TEXT,
    Paused INTEGER,
    PausedSeries TEXT
);

-- Import to temp table
COPY temp_noise_data FROM '/seed/NoiseData.csv' DELIMITER ',' CSV HEADER;

WITH bounds AS (
    SELECT max(Time) AS max_t FROM temp_noise_data
)
INSERT INTO "NoiseData" ("Id", "Time", "LCPK", "LAEQ", "UserId")
SELECT gen_random_uuid(), n.Time, n.LCPK, n.LAEQ, :'KARI_ID'
FROM temp_noise_data n
CROSS JOIN bounds b
WHERE (
  :'RECENT_ONLY'::int = 0
  OR (
    n.Time >= (date_trunc('month', b.max_t) - interval '1 month')
    AND n.Time <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

WITH bounds AS (
    SELECT max(Time) AS max_t FROM temp_noise_data
)
INSERT INTO "NoiseData" ("Id", "Time", "LCPK", "LAEQ", "UserId")
SELECT
  gen_random_uuid(),
  n.Time,
  (n.LCPK * p.mult_noise) + (r.j * (2*p.jit_noise) - p.jit_noise),
  (n.LAEQ * p.mult_noise) + (r.j * (2*p.jit_noise) - p.jit_noise),
  p.user_id
FROM temp_noise_data n
CROSS JOIN seed_user_profile p
CROSS JOIN bounds b
CROSS JOIN LATERAL (SELECT random() AS j) r
WHERE (
  :'RECENT_ONLY'::int = 0
  OR (
    n.Time >= (date_trunc('month', b.max_t) - interval '1 month')
    AND n.Time <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

DROP TABLE temp_noise_data;

-- VIBRATION DATA

-- Empty the table before seeding
TRUNCATE TABLE "VibrationData" RESTART IDENTITY CASCADE;

-- Create temporary table matching ALL CSV columns
CREATE TEMP TABLE temp_vibration_data (
    Date TIMESTAMP,
    ConnectedOn TIMESTAMP,
    DisconnectedOn TIMESTAMP,
    "Tag Vibration (m/s2)" DECIMAL,
    "Sensed Vibration (m/s2)" DECIMAL,
    TriggerTime TEXT,
    "TriggerTime (seconds)" INTEGER,
    "Tag Exposure Points" DECIMAL,
    "Sensed Exposure Points" DECIMAL,
    Overdose INTEGER,
    "EAV Level" INTEGER,
    "TEP EAV Reached" TEXT,
    "SEP EAV Reached" TEXT,
    "ELV Level" INTEGER,
    "TEP ELV Reached" TEXT,
    "SEP ELV Reached" TEXT,
    BaseStationID TEXT,
    Division TEXT,
    HAVUnitID TEXT,
    Manufacturer TEXT,
    Model TEXT,
    OperatorID TEXT,
    OperatorName TEXT,
    "Operator First Name" TEXT,
    "Operator Last Name" TEXT,
    Project TEXT,
    Region TEXT,
    TagID TEXT,
    ToolID TEXT,
    ToolName TEXT,
    "Removed From Rasor ID" TEXT,
    "Returned To Rasor ID" TEXT
);

-- Import to temp table
COPY temp_vibration_data FROM '/seed/VibrationData.csv' DELIMITER ',' CSV HEADER;

-- Insert data into VibrationData table with date format conversion
WITH bounds AS (
    SELECT max(ConnectedOn) AS max_t FROM temp_vibration_data
)
INSERT INTO "VibrationData" ("Id", "ConnectedOn", "Exposure", "DisconnectedOn", "UserId")
SELECT 
    gen_random_uuid(),
  v.ConnectedOn,
  v."Tag Exposure Points",
  v.DisconnectedOn,
    :'KARI_ID'
FROM temp_vibration_data v
CROSS JOIN bounds b
WHERE v.ConnectedOn IS NOT NULL AND v.DisconnectedOn IS NOT NULL
AND (
  :'RECENT_ONLY'::int = 0
  OR (
    v.ConnectedOn >= (date_trunc('month', b.max_t) - interval '1 month')
    AND v.ConnectedOn    <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

WITH bounds AS (
    SELECT max(ConnectedOn) AS max_t FROM temp_vibration_data
)
INSERT INTO "VibrationData" ("Id", "ConnectedOn", "Exposure", "DisconnectedOn", "UserId")
SELECT
  gen_random_uuid(),
  v.ConnectedOn,
  (v."Tag Exposure Points" * p.mult_vib) + (random() * (2*p.jit_vib) - p.jit_vib),
  v.DisconnectedOn,
  p.user_id
FROM temp_vibration_data v
CROSS JOIN seed_user_profile p
CROSS JOIN bounds b
WHERE v.ConnectedOn IS NOT NULL AND v.DisconnectedOn IS NOT NULL
AND (
  :'RECENT_ONLY'::int = 0
  OR (
    v.ConnectedOn >= (date_trunc('month', b.max_t) - interval '1 month')
    AND v.ConnectedOn    <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

DROP TABLE temp_vibration_data;

-- DUST DATA

-- Empty the table before seeding
TRUNCATE TABLE "DustData" RESTART IDENTITY CASCADE;

-- Create temporary table matching ALL CSV columns
CREATE TEMP TABLE temp_dust_data (
    Timestamp TEXT,
    "PM 1 Live" DECIMAL,
    "PM 1 STEL" DECIMAL,
    "PM 1 TWA" DECIMAL,
    "PM 2.5 Live" DECIMAL,
    "PM 2.5 STEL" DECIMAL,
    "PM 2.5 TWA" DECIMAL,
    "PM 4.25 Live" DECIMAL,
    "PM 4.25 STEL" DECIMAL,
    "PM 4.25 TWA" DECIMAL,
    "PM 10.0 Live" DECIMAL,
    "PM 10.0 STEL" DECIMAL,
    "PM 10.0 TWA" DECIMAL,
    "STEL Threshold" DECIMAL,
    "TWA Threshold" DECIMAL
);

-- Import to temp table
COPY temp_dust_data FROM '/seed/DustData.csv' DELIMITER ',' CSV HEADER;

WITH bounds AS (
    SELECT max(Timestamp::TIMESTAMP WITH TIME ZONE) AS max_t FROM temp_dust_data
)
INSERT INTO "DustData" ("Id", "Time", "PM1S", "PM25S", "PM4S", "PM10S", "PM1T", "PM25T", "PM4T", "PM10T", "UserId")
SELECT 
    gen_random_uuid(),
  d.Timestamp::TIMESTAMP WITH TIME ZONE,
  d."PM 1 STEL",
  d."PM 2.5 STEL",
  d."PM 4.25 STEL",
  d."PM 10.0 STEL",
  d."PM 1 TWA",
  d."PM 2.5 TWA",
  d."PM 4.25 TWA",
  d."PM 10.0 TWA",
    :'KARI_ID'
FROM temp_dust_data d
CROSS JOIN bounds b
WHERE d.Timestamp IS NOT NULL
AND (
  :'RECENT_ONLY'::int = 0
  OR (
    d.Timestamp::TIMESTAMP WITH TIME ZONE >= (date_trunc('month', b.max_t) - interval '1 month')
    AND d.Timestamp::TIMESTAMP WITH TIME ZONE <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

WITH bounds AS (
    SELECT max(Timestamp::TIMESTAMP WITH TIME ZONE) AS max_t FROM temp_dust_data
)
INSERT INTO "DustData" (
  "Id","Time","PM1S","PM25S","PM4S","PM10S","PM1T","PM25T","PM4T","PM10T","UserId"
)
SELECT
  gen_random_uuid(),
  d.Timestamp::timestamptz,
  (d."PM 1 STEL"   * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 2.5 STEL" * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 4.25 STEL"* p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 10.0 STEL"* p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 1 TWA"    * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 2.5 TWA"  * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 4.25 TWA" * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  (d."PM 10.0 TWA" * p.mult_dust) + (r.j * (2*p.jit_dust) - p.jit_dust),
  p.user_id
FROM temp_dust_data d
CROSS JOIN seed_user_profile p
CROSS JOIN LATERAL (SELECT random() AS j) r
CROSS JOIN bounds b
WHERE d.Timestamp IS NOT NULL
AND (
  :'RECENT_ONLY'::int = 0
  OR (
    d.Timestamp::TIMESTAMP WITH TIME ZONE >= (date_trunc('month', b.max_t) - interval '1 month')
    AND d.Timestamp::TIMESTAMP WITH TIME ZONE <  (date_trunc('month', b.max_t) + interval '2 months')
  )
);

DROP TABLE temp_dust_data;

DROP TABLE seed_user_profile;


-- Transforms the tables into hypertables if their not already
SELECT create_hypertable('"NoiseData"', 'Time', if_not_exists => TRUE);
SELECT create_hypertable('"VibrationData"', 'ConnectedOn', if_not_exists => TRUE);
SELECT create_hypertable('"DustData"', 'Time', if_not_exists => TRUE);

-- Drops the materialized views if they already exist
DROP MATERIALIZED VIEW IF EXISTS noise_data_hourly;
DROP MATERIALIZED VIEW IF EXISTS noise_data_daily;
DROP MATERIALIZED VIEW IF EXISTS noise_data_minutely;

DROP MATERIALIZED VIEW IF EXISTS vibration_data_hourly;
DROP MATERIALIZED VIEW IF EXISTS vibration_data_daily;
DROP MATERIALIZED VIEW IF EXISTS vibration_data_minutely;

DROP MATERIALIZED VIEW IF EXISTS dust_data_hourly;
DROP MATERIALIZED VIEW IF EXISTS dust_data_daily;
DROP MATERIALIZED VIEW IF EXISTS dust_data_minutely;

-- Time variables
\set MINUTE_INTERVAL 'INTERVAL ''1 minute'''
\set HOUR_INTERVAL 'INTERVAL ''1 hour'''
\set DAY_INTERVAL 'INTERVAL ''1 day'''

-- Noise Data

-- Minute aggregation: Groups data into 1 minute intervals and calculates average, sum, count, min, and max exposure levels.
CREATE MATERIALIZED VIEW noise_data_minutely AS
SELECT 
    time_bucket(:MINUTE_INTERVAL, "Time") AS bucket,
    "UserId" as user_id,
    AVG("LCPK") AS avg_noise_lcpk,
    SUM("LCPK") AS sum_noise_lcpk,
    MIN("LCPK") AS min_noise_lcpk,
    MAX("LCPK") AS max_noise_lcpk,
    AVG("LAEQ") AS avg_noise_laeq,
    SUM("LAEQ") AS sum_noise_laeq,
    MIN("LAEQ") AS min_noise_laeq,
    MAX("LAEQ") AS max_noise_laeq,
    COUNT(*) AS sample_count
FROM "NoiseData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

-- Hour aggregation: Groups data into 1 hour intervals and calculates average, sum, count, min, and max exposure levels.
CREATE MATERIALIZED VIEW noise_data_hourly AS
SELECT 
    time_bucket(:HOUR_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("LCPK") AS avg_noise_lcpk,
    SUM("LCPK") AS sum_noise_lcpk,
    MIN("LCPK") AS min_noise_lcpk,
    MAX("LCPK") AS max_noise_lcpk,
    AVG("LAEQ") AS avg_noise_laeq,
    SUM("LAEQ") AS sum_noise_laeq,
    MIN("LAEQ") AS min_noise_laeq,
    MAX("LAEQ") AS max_noise_laeq,
    COUNT(*) AS sample_count
FROM "NoiseData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

-- Daily aggregation: Groups data into 1 day intervals and calculates average, sum, count, min, and max exposure levels.
CREATE MATERIALIZED VIEW noise_data_daily AS
SELECT 
    time_bucket(:DAY_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("LCPK") AS avg_noise_lcpk,
    SUM("LCPK") AS sum_noise_lcpk,
    MIN("LCPK") AS min_noise_lcpk,
    MAX("LCPK") AS max_noise_lcpk,
    AVG("LAEQ") AS avg_noise_laeq,
    SUM("LAEQ") AS sum_noise_laeq,
    MIN("LAEQ") AS min_noise_laeq,
    MAX("LAEQ") AS max_noise_laeq,
    COUNT(*) AS sample_count
FROM "NoiseData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;


-- Vibration Data

CREATE MATERIALIZED VIEW vibration_data_minutely AS
SELECT 
    time_bucket(:MINUTE_INTERVAL, "ConnectedOn") AS bucket,
    "UserId" AS user_id,
    AVG("Exposure") AS avg_vibration,
    SUM("Exposure") AS sum_vibration,
    COUNT(*) AS sample_count,
    MIN("Exposure") AS min_vibration,
    MAX("Exposure") AS max_vibration
FROM "VibrationData"
WHERE "ConnectedOn" IS NOT NULL
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

CREATE MATERIALIZED VIEW vibration_data_hourly AS
SELECT 
    time_bucket(:HOUR_INTERVAL, "ConnectedOn") AS bucket,
    "UserId" AS user_id,
    AVG("Exposure") AS avg_vibration,
    SUM("Exposure") AS sum_vibration,
    COUNT(*) AS sample_count,
    MIN("Exposure") AS min_vibration,
    MAX("Exposure") AS max_vibration
FROM "VibrationData"
WHERE "ConnectedOn" IS NOT NULL
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

CREATE MATERIALIZED VIEW vibration_data_daily AS
SELECT 
    time_bucket(:DAY_INTERVAL, "ConnectedOn") AS bucket,
    "UserId" AS user_id,
    AVG("Exposure") AS avg_vibration,
    SUM("Exposure") AS sum_vibration,
    COUNT(*) AS sample_count,
    MIN("Exposure") AS min_vibration,
    MAX("Exposure") AS max_vibration
FROM "VibrationData"
WHERE "ConnectedOn" IS NOT NULL
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;


-- Dust Data

CREATE MATERIALIZED VIEW dust_data_minutely AS
SELECT 
    time_bucket(:MINUTE_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("PM1S") AS avg_dust_pm1_stel,
    AVG("PM25S") AS avg_dust_pm25_stel,
    AVG("PM4S") AS avg_dust_pm4_stel,
    AVG("PM10S") AS avg_dust_pm10_stel,
    SUM("PM1S") AS sum_dust_pm1_stel,
    SUM("PM25S") AS sum_dust_pm25_stel,
    SUM("PM4S") AS sum_dust_pm4_stel,
    SUM("PM10S") AS sum_dust_pm10_stel,
    COUNT(*) AS sample_count,
    MIN("PM1S") AS min_dust_pm1_stel,
    MIN("PM25S") AS min_dust_pm25_stel,
    MIN("PM4S") AS min_dust_pm4_stel,
    MIN("PM10S") AS min_dust_pm10_stel,
    MAX("PM1S") AS max_dust_pm1_stel,
    MAX("PM25S") AS max_dust_pm25_stel, 
    MAX("PM4S") AS max_dust_pm4_stel,
    MAX("PM10S") AS max_dust_pm10_stel,
    AVG("PM1T") AS avg_dust_pm1_twa,
    AVG("PM25T") AS avg_dust_pm25_twa,
    AVG("PM4T") AS avg_dust_pm4_twa,
    AVG("PM10T") AS avg_dust_pm10_twa,
    SUM("PM1T") AS sum_dust_pm1_twa,
    SUM("PM25T") AS sum_dust_pm25_twa,
    SUM("PM4T") AS sum_dust_pm4_twa,
    SUM("PM10T") AS sum_dust_pm10_twa,
    MIN("PM1T") AS min_dust_pm1_twa,
    MIN("PM25T") AS min_dust_pm25_twa,
    MIN("PM4T") AS min_dust_pm4_twa,
    MIN("PM10T") AS min_dust_pm10_twa,
    MAX("PM1T") AS max_dust_pm1_twa,
    MAX("PM25T") AS max_dust_pm25_twa,
    MAX("PM4T") AS max_dust_pm4_twa,
    MAX("PM10T") AS max_dust_pm10_twa
FROM "DustData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

CREATE MATERIALIZED VIEW dust_data_hourly AS
SELECT 
    time_bucket(:HOUR_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("PM1S") AS avg_dust_pm1_stel,
    AVG("PM25S") AS avg_dust_pm25_stel,
    AVG("PM4S") AS avg_dust_pm4_stel,
    AVG("PM10S") AS avg_dust_pm10_stel,
    SUM("PM1S") AS sum_dust_pm1_stel,
    SUM("PM25S") AS sum_dust_pm25_stel,
    SUM("PM4S") AS sum_dust_pm4_stel,
    SUM("PM10S") AS sum_dust_pm10_stel,
    COUNT(*) AS sample_count,
    MIN("PM1S") AS min_dust_pm1_stel,
    MIN("PM25S") AS min_dust_pm25_stel,
    MIN("PM4S") AS min_dust_pm4_stel,
    MIN("PM10S") AS min_dust_pm10_stel,
    MAX("PM1S") AS max_dust_pm1_stel,
    MAX("PM25S") AS max_dust_pm25_stel, 
    MAX("PM4S") AS max_dust_pm4_stel,
    MAX("PM10S") AS max_dust_pm10_stel,
    AVG("PM1T") AS avg_dust_pm1_twa,
    AVG("PM25T") AS avg_dust_pm25_twa,
    AVG("PM4T") AS avg_dust_pm4_twa,
    AVG("PM10T") AS avg_dust_pm10_twa,
    SUM("PM1T") AS sum_dust_pm1_twa,
    SUM("PM25T") AS sum_dust_pm25_twa,
    SUM("PM4T") AS sum_dust_pm4_twa,
    SUM("PM10T") AS sum_dust_pm10_twa,
    MIN("PM1T") AS min_dust_pm1_twa,
    MIN("PM25T") AS min_dust_pm25_twa,
    MIN("PM4T") AS min_dust_pm4_twa,
    MIN("PM10T") AS min_dust_pm10_twa,
    MAX("PM1T") AS max_dust_pm1_twa,
    MAX("PM25T") AS max_dust_pm25_twa,
    MAX("PM4T") AS max_dust_pm4_twa,
    MAX("PM10T") AS max_dust_pm10_twa
FROM "DustData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

CREATE MATERIALIZED VIEW dust_data_daily AS
SELECT 
    time_bucket(:DAY_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("PM1S") AS avg_dust_pm1_stel,
    AVG("PM25S") AS avg_dust_pm25_stel,
    AVG("PM4S") AS avg_dust_pm4_stel,
    AVG("PM10S") AS avg_dust_pm10_stel,
    SUM("PM1S") AS sum_dust_pm1_stel,
    SUM("PM25S") AS sum_dust_pm25_stel,
    SUM("PM4S") AS sum_dust_pm4_stel,
    SUM("PM10S") AS sum_dust_pm10_stel,
    COUNT(*) AS sample_count,
    MIN("PM1S") AS min_dust_pm1_stel,
    MIN("PM25S") AS min_dust_pm25_stel,
    MIN("PM4S") AS min_dust_pm4_stel,
    MIN("PM10S") AS min_dust_pm10_stel,
    MAX("PM1S") AS max_dust_pm1_stel,
    MAX("PM25S") AS max_dust_pm25_stel, 
    MAX("PM4S") AS max_dust_pm4_stel,
    MAX("PM10S") AS max_dust_pm10_stel,
    AVG("PM1T") AS avg_dust_pm1_twa,
    AVG("PM25T") AS avg_dust_pm25_twa,
    AVG("PM4T") AS avg_dust_pm4_twa,
    AVG("PM10T") AS avg_dust_pm10_twa,
    SUM("PM1T") AS sum_dust_pm1_twa,
    SUM("PM25T") AS sum_dust_pm25_twa,
    SUM("PM4T") AS sum_dust_pm4_twa,
    SUM("PM10T") AS sum_dust_pm10_twa,
    MIN("PM1T") AS min_dust_pm1_twa,
    MIN("PM25T") AS min_dust_pm25_twa,
    MIN("PM4T") AS min_dust_pm4_twa,
    MIN("PM10T") AS min_dust_pm10_twa,
    MAX("PM1T") AS max_dust_pm1_twa,
    MAX("PM25T") AS max_dust_pm25_twa,
    MAX("PM4T") AS max_dust_pm4_twa,
    MAX("PM10T") AS max_dust_pm10_twa
FROM "DustData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;


-- Create indexes on materialized views for better query performance when querying based on the time bucket
CREATE INDEX idx_noise_minutely_bucket ON noise_data_minutely(bucket);
CREATE INDEX idx_noise_hourly_bucket ON noise_data_hourly(bucket);
CREATE INDEX idx_noise_daily_bucket ON noise_data_daily(bucket);

CREATE INDEX idx_vibration_minutely_bucket ON vibration_data_minutely(bucket);
CREATE INDEX idx_vibration_hourly_bucket ON vibration_data_hourly(bucket);
CREATE INDEX idx_vibration_daily_bucket ON vibration_data_daily(bucket);

CREATE INDEX idx_dust_minutely_bucket ON dust_data_minutely(bucket);
CREATE INDEX idx_dust_hourly_bucket ON dust_data_hourly(bucket);
CREATE INDEX idx_dust_daily_bucket ON dust_data_daily(bucket);

-- ...existing code...
