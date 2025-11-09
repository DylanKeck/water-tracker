-- Description: Create table for logging water intake associated with user profiles and tasks
DROP TABLE IF EXISTS water_log;

CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

CREATE TABLE IF NOT EXISTS water_log (
    water_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    water_log_profile_id UUID NOT NULL,
    water_log_task_id UUID NOT NULL,
    water_log_amount_liters INT NOT NULL CHECK (water_log_amount_liters > 0),
    water_log_logged_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (water_log_profile_id) REFERENCES profile(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (water_log_task_id) REFERENCES task(task_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_water_logs_profile_id ON water_log(water_log_profile_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_task_id ON water_log(water_log_task_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON water_log(water_log_logged_at DESC
);
COMMENT ON TABLE water_log IS 'Logs of water intake associated with user profiles and tasks';
COMMENT ON COLUMN water_log.water_log_id IS 'UUID v7 primary key';
COMMENT ON COLUMN water_log.water_log_profile_id IS 'Foreign key to profile table';
COMMENT ON COLUMN water_log.water_log_task_id IS 'Foreign key to task table';
COMMENT ON COLUMN water_log.water_log_amount_liters IS 'Amount of water logged in liters (
positive integer)';
COMMENT ON COLUMN water_log.water_log_logged_at IS 'Timestamp when the water intake was logged';

