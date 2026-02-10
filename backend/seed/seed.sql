-- User ID variables
\set OLA_ID '12345678-1234-5678-1234-567812345678'
\set KARI_ID '87654321-8765-4321-8765-432187654321'

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
    '$2a$11$QXVHkr6TQC8gJvh5P4GFzOYc.HyZA3FxDC3/BghAM3hODQVAoWwwi', -- hashed 'password123'
    NOW(),
    'Formann for bygg 1',
    :'VERDAL_ID',
    'Foreman'),
    (:'KARI_ID',
    'Kari Nordmann',
    'kari.nordmann@aker.com',
    '$2a$11$k5RIyHdZgB2VrXEY8iShzOiSNr3ZVVZd5GmWJHJFHQUKJROtajTxK', -- hashed 'password456'
    NOW(),
    'Sveiser',
    :'SANDSLI_ID',
    'Operator');

-- UserManagers
INSERT INTO "UserManagers" ("ManagersId", "SubordinatesId")
VALUES
    (:'OLA_ID', :'KARI_ID'); -- Ola is the manager of Kari

-- NOISE DATA

-- Drop temporary table if it exists
DELETE FROM "NoiseData";

-- Create temporary table matching ALL CSV columns
CREATE TABLE temp_noise_data (
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

INSERT INTO "NoiseData" ("Id", "Time", "LavgQ3", "UserId")
SELECT gen_random_uuid(), Time, "LAVG (Q3)", :'KARI_ID'
FROM temp_noise_data;

DROP TABLE temp_noise_data;

-- VIBRATION DATA

-- Empty the table before seeding
DELETE FROM "VibrationData";

-- Create temporary table matching ALL CSV columns
CREATE TABLE temp_vibration_data (
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
INSERT INTO "VibrationData" ("Id", "ConnectedOn", "Exposure", "DisconnectedOn", "UserId")
SELECT 
    gen_random_uuid(),
    ConnectedOn,
    "Tag Exposure Points",
    DisconnectedOn,
    :'KARI_ID'
FROM temp_vibration_data
WHERE ConnectedOn IS NOT NULL AND DisconnectedOn IS NOT NULL;

DROP TABLE temp_vibration_data;

-- DUST DATA

-- Empty the table before seeding
DELETE FROM "DustData";

-- Create temporary table matching ALL CSV columns
CREATE TABLE temp_dust_data (
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

INSERT INTO "DustData" ("Id", "Time", "PM1S", "PM25S", "PM4S", "PM10S", "PM1T", "PM25T", "PM4T", "PM10T", "UserId")
SELECT 
    gen_random_uuid(),
    Timestamp::TIMESTAMP WITH TIME ZONE,
    "PM 1 STEL",
    "PM 2.5 STEL",
    "PM 4.25 STEL",
    "PM 10.0 STEL",
    "PM 1 TWA",
    "PM 2.5 TWA",
    "PM 4.25 TWA",
    "PM 10.0 TWA",
    :'KARI_ID'
FROM temp_dust_data
WHERE Timestamp IS NOT NULL;

DROP TABLE temp_dust_data;



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
    AVG("LavgQ3") AS avg_noise,
    SUM("LavgQ3") AS sum_noise,
    COUNT(*) AS sample_count,
    MIN("LavgQ3") AS min_noise,
    MAX("LavgQ3") AS max_noise
FROM "NoiseData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

-- Hour aggregation: Groups data into 1 hour intervals and calculates average, sum, count, min, and max exposure levels.
CREATE MATERIALIZED VIEW noise_data_hourly AS
SELECT 
    time_bucket(:HOUR_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("LavgQ3") AS avg_noise,
    SUM("LavgQ3") AS sum_noise,
    COUNT(*) AS sample_count,
    MIN("LavgQ3") AS min_noise,
    MAX("LavgQ3") AS max_noise
FROM "NoiseData"
GROUP BY bucket, "user_id"
ORDER BY bucket ASC;

-- Daily aggregation: Groups data into 1 day intervals and calculates average, sum, count, min, and max exposure levels.
CREATE MATERIALIZED VIEW noise_data_daily AS
SELECT 
    time_bucket(:DAY_INTERVAL, "Time") AS bucket,
    "UserId" AS user_id,
    AVG("LavgQ3") AS avg_noise,
    SUM("LavgQ3") AS sum_noise,
    COUNT(*) AS sample_count,
    MIN("LavgQ3") AS min_noise,
    MAX("LavgQ3") AS max_noise
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
