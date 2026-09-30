-- DO NOT RUN!!!!!!!
-- -- 1. Clean up existing tables (optional, use with caution)
-- DROP TABLE IF EXISTS zhvi_value CASCADE;
-- DROP TABLE IF EXISTS acs_income CASCADE;
-- DROP TABLE IF EXISTS region CASCADE;

-- 2. Create the Region Table
-- This is the parent table. region_id should correspond to Zillow's RegionID.
-- CREATE TABLE region (
--     region_id   INT PRIMARY KEY,
--     region_name TEXT NOT NULL,
--     state_name  VARCHAR(2), -- Using 2-letter abbreviations (e.g., 'PA')
--     region_type TEXT,        -- e.g., 'City', 'County', 'Zip'
--     lat         DOUBLE PRECISION,
--     lon         DOUBLE PRECISION
-- );

-- -- 3. Create the ACS Income Table
-- CREATE TABLE acs_income (
--     region_id        INT,
--     year             INT,
--     household_income DOUBLE PRECISION,
--     num_households   INT,
--     PRIMARY KEY (region_id, year),
--     FOREIGN KEY (region_id) REFERENCES region(region_id) ON DELETE CASCADE

-- );

-- -- 4. Create the ZHVI Value Table
-- -- home_type corresponds to the Zillow dataset type (e.g., 'All Homes', 'Single Family')
-- CREATE TABLE zhvi_value (
--     region_id INT,
--     date      DATE,
--     value     DOUBLE PRECISION,
--     PRIMARY KEY (region_id, date),
--     FOREIGN KEY (region_id) REFERENCES region(region_id) ON DELETE CASCADE
-- );

-- -- 5. Performance Optimization Indexes
-- -- These are critical for the complex queries in Milestone 3
-- CREATE INDEX idx_zhvi_date ON zhvi_value(date);
-- CREATE INDEX idx_acs_year ON acs_income(year);
-- CREATE INDEX idx_region_state ON region(state_name);

SELECT COUNT(*) AS total_regions
FROM region;

SELECT year, AVG(household_income) AS avg_income
FROM acs_income
GROUP BY year
ORDER BY year;

SELECT region_id, value
FROM zhvi_value
WHERE date = '2025-12-31';

SELECT r.region_id, r.state_name, z.value
FROM zhvi_value z
JOIN region r ON z.region_id = r.region_id
WHERE z.date = '2025-12-31'
ORDER BY z.value DESC
LIMIT 25;

SELECT r.region_id, r.state_name, a.household_income,
       RANK() OVER (ORDER BY a.household_income DESC) AS income_rank
FROM acs_income a
JOIN region r ON a.region_id = r.region_id;

SELECT r.state_name, AVG(z.value) AS avg_home_value
FROM zhvi_value z
JOIN region r ON z.region_id = r.region_id
WHERE z.date = '2025-12-31'
GROUP BY r.state_name
ORDER BY avg_home_value DESC;

WITH latest_income AS (
    SELECT region_id, household_income
    FROM acs_income
    WHERE household_income > 0
),
latest_home AS (
    SELECT region_id, value
    FROM zhvi_value
    WHERE date = '2025-12-31'
)
SELECT r.region_id,
       r.state_name,
       l.value,
       i.household_income,
       ROUND((l.value / i.household_income)::numeric, 2) AS affordability_ratio
FROM latest_income i
JOIN latest_home l ON i.region_id = l.region_id
JOIN region r ON r.region_id = i.region_id
ORDER BY affordability_ratio DESC;

WITH income_ranked AS (
    SELECT region_id,
           household_income,
           NTILE(4) OVER (ORDER BY household_income DESC) AS income_quartile
    FROM acs_income
    WHERE year = 2023
),
joined_data AS (
    SELECT i.region_id,
           i.household_income,
           z.value,
           (z.value / i.household_income) AS ratio
    FROM income_ranked i
    JOIN zhvi_value z ON i.region_id = z.region_id
    WHERE z.date = '2025-12-31'
)
SELECT *
FROM joined_data
WHERE region_id IN (
    SELECT region_id FROM income_ranked WHERE income_quartile = 1
)
ORDER BY ratio DESC;

SELECT region_id,
           household_income
    FROM acs_income
    WHERE year = 2024;

-- DELETE FROM acs_income WHERE True;
-- select count(*) from acs_income;

WITH target AS (
SELECT i.region_id,
i.household_income,
z.value
FROM acs_income i
JOIN zhvi_value z ON i.region_id = z.region_id
WHERE i.year = (SELECT MAX(year) FROM acs_income)
AND z.date = (SELECT MAX(date) FROM zhvi_value)
),
all_regions AS (
SELECT i.region_id,
r.region_name,
r.state_name,
i.household_income,
z.value
FROM acs_income i
JOIN zhvi_value z ON i.region_id = z.region_id
JOIN region r ON i.region_id = r.region_id
WHERE i.year = (SELECT MAX(year) FROM acs_income)
AND z.date = (SELECT MAX(date) FROM zhvi_value)
)
SELECT a.region_id,
a.region_name,
a.state_name,
a.household_income,
a.value,
ABS(a.household_income - t.household_income) +
ABS(a.value - t.value) AS similarity_score
FROM all_regions a
CROSS JOIN target t
WHERE a.region_id <> t.region_id and t.region_id = 41997
ORDER BY similarity_score ASC LIMIT 10;
SELECT r.region_id,
r.region_name,
r.state_name,
z.date,
z.value,
LAG(z.value) OVER (PARTITION BY z.region_id ORDER BY z.date) AS prev_value,
ROUND(
(
(z.value - LAG(z.value) OVER (PARTITION BY z.region_id ORDER BY z.date))
/ NULLIF(LAG(z.value) OVER (PARTITION BY z.region_id ORDER BY z.date), 0)
)::numeric * 100,
2
) AS pct_growth
FROM zhvi_value z
JOIN region r ON z.region_id = r.region_id
ORDER BY z.region_id, z.date;

