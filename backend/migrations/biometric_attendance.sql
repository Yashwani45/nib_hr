CREATE TABLE IF NOT EXISTS biometric_device_users (
  id CHAR(36) NOT NULL,
  employee_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  device_user_id VARCHAR(100) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bio_device_user (device_id, device_user_id),
  UNIQUE KEY uq_bio_employee_device (employee_id, device_id),
  KEY idx_bio_mapping_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biometric_devices (
  device_id VARCHAR(100) NOT NULL,
  last_seen_at DATETIME(3) NULL,
  PRIMARY KEY (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS biometric_attendance_events (
  id CHAR(36) NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  device_event_id VARCHAR(128) NOT NULL,
  employee_id VARCHAR(36) NOT NULL,
  device_user_id VARCHAR(100) NOT NULL,
  event_timestamp DATETIME(3) NOT NULL,
  punch_type ENUM('IN', 'OUT') NOT NULL,
  source VARCHAR(64) NOT NULL,
  attendance_id INT NULL,
  status VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bio_device_event (device_id, device_event_id),
  KEY idx_bio_employee_timestamp (employee_id, event_timestamp),
  KEY idx_bio_attendance (attendance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
