using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
	/// <inheritdoc />
	public partial class AddMaterializedViews : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.Sql(
				"""
				CREATE MATERIALIZED VIEW IF NOT EXISTS noise_data_minutely AS
				SELECT
				    time_bucket(INTERVAL '1 minute', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS noise_data_hourly AS
				SELECT
				    time_bucket(INTERVAL '1 hour', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS noise_data_daily AS
				SELECT
				    time_bucket(INTERVAL '1 day', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS vibration_data_minutely AS
				SELECT
				    time_bucket(INTERVAL '1 minute', "ConnectedOn") AS bucket,
				    "UserId" AS user_id,
				    AVG("Exposure") AS avg_vibration,
				    SUM("Exposure") AS sum_vibration,
				    COUNT(*) AS sample_count,
				    MIN("Exposure") AS min_vibration,
				    MAX("Exposure") AS max_vibration
				FROM "VibrationData"
				WHERE "ConnectedOn" IS NOT NULL
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS vibration_data_hourly AS
				SELECT
				    time_bucket(INTERVAL '1 hour', "ConnectedOn") AS bucket,
				    "UserId" AS user_id,
				    AVG("Exposure") AS avg_vibration,
				    SUM("Exposure") AS sum_vibration,
				    COUNT(*) AS sample_count,
				    MIN("Exposure") AS min_vibration,
				    MAX("Exposure") AS max_vibration
				FROM "VibrationData"
				WHERE "ConnectedOn" IS NOT NULL
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS vibration_data_daily AS
				SELECT
				    time_bucket(INTERVAL '1 day', "ConnectedOn") AS bucket,
				    "UserId" AS user_id,
				    AVG("Exposure") AS avg_vibration,
				    SUM("Exposure") AS sum_vibration,
				    COUNT(*) AS sample_count,
				    MIN("Exposure") AS min_vibration,
				    MAX("Exposure") AS max_vibration
				FROM "VibrationData"
				WHERE "ConnectedOn" IS NOT NULL
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS dust_data_minutely AS
				SELECT
				    time_bucket(INTERVAL '1 minute', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS dust_data_hourly AS
				SELECT
				    time_bucket(INTERVAL '1 hour', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE MATERIALIZED VIEW IF NOT EXISTS dust_data_daily AS
				SELECT
				    time_bucket(INTERVAL '1 day', "Time") AS bucket,
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
				GROUP BY bucket, user_id
				ORDER BY bucket ASC;

				CREATE INDEX IF NOT EXISTS idx_noise_minutely_bucket ON noise_data_minutely(bucket);
				CREATE INDEX IF NOT EXISTS idx_noise_hourly_bucket ON noise_data_hourly(bucket);
				CREATE INDEX IF NOT EXISTS idx_noise_daily_bucket ON noise_data_daily(bucket);

				CREATE INDEX IF NOT EXISTS idx_vibration_minutely_bucket ON vibration_data_minutely(bucket);
				CREATE INDEX IF NOT EXISTS idx_vibration_hourly_bucket ON vibration_data_hourly(bucket);
				CREATE INDEX IF NOT EXISTS idx_vibration_daily_bucket ON vibration_data_daily(bucket);

				CREATE INDEX IF NOT EXISTS idx_dust_minutely_bucket ON dust_data_minutely(bucket);
				CREATE INDEX IF NOT EXISTS idx_dust_hourly_bucket ON dust_data_hourly(bucket);
				CREATE INDEX IF NOT EXISTS idx_dust_daily_bucket ON dust_data_daily(bucket);
				"""
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.Sql(
				"""
				DROP INDEX IF EXISTS idx_dust_daily_bucket;
				DROP INDEX IF EXISTS idx_dust_hourly_bucket;
				DROP INDEX IF EXISTS idx_dust_minutely_bucket;

				DROP INDEX IF EXISTS idx_vibration_daily_bucket;
				DROP INDEX IF EXISTS idx_vibration_hourly_bucket;
				DROP INDEX IF EXISTS idx_vibration_minutely_bucket;

				DROP INDEX IF EXISTS idx_noise_daily_bucket;
				DROP INDEX IF EXISTS idx_noise_hourly_bucket;
				DROP INDEX IF EXISTS idx_noise_minutely_bucket;

				DROP MATERIALIZED VIEW IF EXISTS dust_data_daily;
				DROP MATERIALIZED VIEW IF EXISTS dust_data_hourly;
				DROP MATERIALIZED VIEW IF EXISTS dust_data_minutely;

				DROP MATERIALIZED VIEW IF EXISTS vibration_data_daily;
				DROP MATERIALIZED VIEW IF EXISTS vibration_data_hourly;
				DROP MATERIALIZED VIEW IF EXISTS vibration_data_minutely;

				DROP MATERIALIZED VIEW IF EXISTS noise_data_daily;
				DROP MATERIALIZED VIEW IF EXISTS noise_data_hourly;
				DROP MATERIALIZED VIEW IF EXISTS noise_data_minutely;
				"""
			);
		}
	}
}
