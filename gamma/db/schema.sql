-- 1. Equipment & Source Management

CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- e.g., 'survey meter', 'alarming ratemeter', 'pocket dosimeter'
    serial_number TEXT UNIQUE NOT NULL,
    calibration_due_date DATE NOT NULL,
    maintenance_status TEXT DEFAULT 'Operational' -- 'Operational', 'Requires Maintenance', 'Out of Service'
);

CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT UNIQUE NOT NULL,
    isotope TEXT NOT NULL, -- e.g., 'Ir-192', 'Co-60'
    initial_activity_curies REAL NOT NULL,
    activity_date DATE NOT NULL,
    current_location TEXT NOT NULL DEFAULT 'Storage Vault',
    status TEXT DEFAULT 'Stored' -- 'Stored', 'Checked Out', 'In Use'
);

CREATE TABLE source_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    checked_out_by TEXT NOT NULL,
    checkout_time DATETIME NOT NULL,
    return_time DATETIME,
    notes TEXT,
    FOREIGN KEY(source_id) REFERENCES sources(id)
);

-- 2. Work Planning & Approvals

CREATE TABLE work_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    planned_date DATE NOT NULL,
    source_id INTEGER NOT NULL,
    collimator_used BOOLEAN DEFAULT 0,
    calculated_boundary_mr_hr REAL NOT NULL, -- 2 mR/hr boundary distance
    chp_reviewer TEXT,
    chp_approval_status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    raso_reviewer TEXT,
    raso_approval_status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_id) REFERENCES sources(id)
);

-- 3. Execution & Monitoring

CREATE TABLE dosimetry_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_plan_id INTEGER NOT NULL,
    personnel_name TEXT NOT NULL,
    dosimeter_serial TEXT NOT NULL,
    initial_reading REAL NOT NULL,
    final_reading REAL,
    logged_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(work_plan_id) REFERENCES work_plans(id)
);

CREATE TABLE boundary_surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_plan_id INTEGER NOT NULL,
    survey_meter_serial TEXT NOT NULL,
    reading_mr_hr REAL NOT NULL,
    location_description TEXT,
    survey_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(work_plan_id) REFERENCES work_plans(id)
);

-- 4. Post-Operation & Reporting

CREATE TABLE post_job_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_plan_id INTEGER NOT NULL,
    source_secured BOOLEAN NOT NULL DEFAULT 0,
    vault_verified BOOLEAN NOT NULL DEFAULT 0,
    daily_log_generated BOOLEAN NOT NULL DEFAULT 0,
    completed_by TEXT NOT NULL,
    completion_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(work_plan_id) REFERENCES work_plans(id)
);
