/*
  # Add Multiple Moisture Depth Support

  1. Changes to `probe_readings_latest`
    - Add `moisture_depths` JSONB column to store array of moisture readings at different depths
    - Add `soil_temp_depths` JSONB column to store array of temperature readings at different depths
    - Keep existing single value columns for backward compatibility

  2. Notes
    - Data structure: {"depths": [{"depth_cm": 10, "value": 34.89, "channel": 178}, ...]}
    - Allows flexible number of sensors per station
*/

-- Add new columns to probe_readings_latest
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_readings_latest' AND column_name = 'moisture_depths'
  ) THEN
    ALTER TABLE probe_readings_latest ADD COLUMN moisture_depths JSONB DEFAULT '{"depths": []}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_readings_latest' AND column_name = 'soil_temp_depths'
  ) THEN
    ALTER TABLE probe_readings_latest ADD COLUMN soil_temp_depths JSONB DEFAULT '{"depths": []}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_readings_latest' AND column_name = 'air_temp_c'
  ) THEN
    ALTER TABLE probe_readings_latest ADD COLUMN air_temp_c NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probe_readings_latest' AND column_name = 'humidity_percent'
  ) THEN
    ALTER TABLE probe_readings_latest ADD COLUMN humidity_percent NUMERIC(5,2);
  END IF;
END $$;
