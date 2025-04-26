-- Migration to add country tracking table

CREATE TABLE IF NOT EXISTS visitor_countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  visit_count INT DEFAULT 1,
  first_visit TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_visit TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ip (ip_address)
);
