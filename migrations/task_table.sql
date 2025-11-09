DROP TABLE IF EXISTS task;

CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

CREATE TABLE IF NOT EXISTS task (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    task_label VARCHAR(100) NOT NULL,
    task_amount_liters INT NOT NULL CHECK (task_amount_liters > 0),
    task_sort_order INT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_sort_order ON task(task_sort_order);
COMMENT ON TABLE task IS 'Tasks with labels and amount in liters';
COMMENT ON COLUMN task.task_id IS 'UUID v7 primary key';
COMMENT ON COLUMN task.task_label IS 'Label for the task (max 100 chars)';
COMMENT ON COLUMN task.task_amount_liters IS 'Amount in liters (positive integer)';
COMMENT ON COLUMN task.task_sort_order IS 'Sort order for displaying tasks';
