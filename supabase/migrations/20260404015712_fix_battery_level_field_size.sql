/*
  # Fix Battery Level Field Size

  1. Changes
    - Increase battery_level field from NUMERIC(5,2) to NUMERIC(8,2)
    - This allows storing battery voltage in millivolts (e.g., 6882 mV)
    - Supports values up to 999999.99
  
  2. Reason
    - FieldClimate reports battery voltage in millivolts
    - Current field size causes numeric overflow
    - Need larger precision to accommodate the data
*/

-- Increase battery_level field size
ALTER TABLE probe_readings_latest 
ALTER COLUMN battery_level TYPE NUMERIC(8,2);
