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
    (:'OLA_ID'::uuid),
    (:'PER_ID'::uuid),
    (:'TROND_ID'::uuid),
    (:'GJERTRUD_ID'::uuid),
    (:'KLARA_ID'::uuid),
    (:'BIRGIR_ID'::uuid),
    (:'TORLEIF_ID'::uuid),
    (:'BJØRNULF_ID'::uuid)
) AS t(u);


-- NOISE DATA

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

-- Refresh materialized views after seeding so aggregated queries are up to date.
REFRESH MATERIALIZED VIEW noise_data_minutely;
REFRESH MATERIALIZED VIEW noise_data_hourly;
REFRESH MATERIALIZED VIEW noise_data_daily;

REFRESH MATERIALIZED VIEW vibration_data_minutely;
REFRESH MATERIALIZED VIEW vibration_data_hourly;
REFRESH MATERIALIZED VIEW vibration_data_daily;

REFRESH MATERIALIZED VIEW dust_data_minutely;
REFRESH MATERIALIZED VIEW dust_data_hourly;
REFRESH MATERIALIZED VIEW dust_data_daily;
