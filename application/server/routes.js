const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

/******************
 * WARM UP ROUTES *
 ******************/

// Route 1: GET /author/:type
const region_count = async function(req, res) {
  // TODO (TASK 1): return the number of songs in each region as an object with region names as keys and counts as values
  connection.query(`SELECT COUNT(*) AS total_regions
FROM region;`, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json({
        total_regions: data.rows[0].total_regions
      });
    }
  });
}


// Route 2: GET /random
const income_average_by_year = async function(req, res) {

  // Here is a complete example of how to query the database in JavaScript.
  // Only a small change (unrelated to querying) is required for TASK 3 in this route.
  connection.query(`
    SELECT year, AVG(household_income) AS avg_income
FROM acs_income
GROUP BY year
ORDER BY year;

  `, (err, data) => {
    if (err) {
      // If there is an error for some reason, print the error message and
      // return an empty object instead
      console.log(err);
      // Be cognizant of the fact we return an empty object {}. For future routes, depending on the
      // return type you may need to return an empty array [] instead.
      res.json({});
    } else {
      // Here, we return results of the query as an object, keeping only relevant data
      // being song_id and title which you will add. In this case, there is only one song
      // so we just directly access the first element of the query results array (data.rows[0])
      // TODO (TASK 3): also return the song title in the response
      res.json(data.rows);
    }
  });
}

/********************************
 * BASIC SONG/ALBUM INFO ROUTES *
 ********************************/

// Route 3: GET /song/:song_id 
const home_values_latest = async function(req, res) {
  // TODO (TASK 4): implement a route that given a song_id, returns all information about the song
  // Hint: unlike route 2, you can directly SELECT * and just return data.rows[0]
  // Most of the code is already written for you, you just need to fill in the query
  connection.query(`SELECT region_id, value
FROM zhvi_value
WHERE date = '2024-12-31';`, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 4: GET /rankings/home-values
const rankings_home_values = async function(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : 25;
  const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';
  const stateFilter = req.query.state_name ? `AND r.state_name = '${req.query.state_name}'` : '';

  connection.query(`
    SELECT r.region_id, r.region_name, r.state_name, z.value
    FROM zhvi_value z
    JOIN region r ON z.region_id = r.region_id
    WHERE z.date = (SELECT MAX(date) FROM zhvi_value) ${stateFilter}
    ORDER BY z.value ${sort}
    ;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

// Route 5: GET /rankings/income
const rankings_income = async function(req, res) {
  const limit = req.query.limit ? `LIMIT ${parseInt(req.query.limit)}` : '';
  const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';
  const stateFilter = req.query.state_name ? `AND r.state_name = '${req.query.state_name}'` : '';

  connection.query(`
    SELECT r.region_id, r.region_name, r.state_name, a.household_income,
           RANK() OVER (ORDER BY a.household_income ${sort}) AS income_rank
    FROM acs_income a
    JOIN region r ON a.region_id = r.region_id
    WHERE a.year = (SELECT MAX(year) FROM acs_income) ${stateFilter} and a.household_income IS NOT NULL
    ORDER BY a.household_income ${sort} 
    ;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

// Route 6: GET /states/average-home-values
const states_average_home_values = async function(req, res) {
  console.log("Received request for average home values by state with query params:", req.query);
  const limit = req.query.limit ? `LIMIT ${parseInt(req.query.limit)}` : '';
  const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';

  connection.query(`
    SELECT r.state_name, AVG(z.value) AS avg_home_value
    FROM zhvi_value z
    JOIN region r ON z.region_id = r.region_id
    WHERE z.date = (SELECT MAX(date) FROM zhvi_value)
    GROUP BY r.state_name
    ORDER BY avg_home_value ${sort}
    ${limit};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}
// Route 7: GET /rankings/affordability
const rankings_affordability = async function(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : 25;
  const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';
  const stateFilter = req.query.state_name ? `AND r.state_name = '${req.query.state_name}'` : '';
  const minRatio = req.query.min_ratio ? `AND (h.value / NULLIF(i.household_income, 0)) >= ${parseFloat(req.query.min_ratio)}` : '';
  const maxRatio = req.query.max_ratio ? `AND (h.value / NULLIF(i.household_income, 0)) <= ${parseFloat(req.query.max_ratio)}` : '';

  connection.query(`
    WITH max_year AS (
      SELECT MAX(year) AS year FROM acs_income
    ),
    max_date AS (
      SELECT MAX(date) AS date FROM zhvi_value
    ),
    latest_income AS (
      SELECT region_id, household_income
      FROM acs_income
      WHERE year = (SELECT year FROM max_year)
    ),
    latest_home AS (
      SELECT region_id, value
      FROM zhvi_value
      WHERE date = (SELECT date FROM max_date)
    )
    SELECT r.region_id, r.region_name, r.state_name, h.value, i.household_income,
           ROUND((h.value / NULLIF(i.household_income, 0))::numeric, 2) AS affordability_ratio
    FROM latest_income i
    JOIN latest_home h USING (region_id)
    JOIN region r USING(region_id)
    WHERE 1=1 ${stateFilter} ${minRatio} ${maxRatio} and i.household_income IS NOT NULL and h.value IS NOT NULL and i.household_income != 0 and h.value != 0
    and (h.value / NULLIF(i.household_income, 0)) IS NOT NULL
    ORDER BY affordability_ratio ${sort} NULLS LAST
    ;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

// Route 8: GET /regions/high-income-poor-affordability
const high_income_poor_affordability = async function(req, res) {
  const limit = req.query.limit ? `LIMIT ${parseInt(req.query.limit)}` : '';
  const stateFilter = req.query.state_name ? `AND r.state_name = '${req.query.state_name}'` : '';
  const minRatio = req.query.min_ratio ? `AND (h.value / NULLIF(i.household_income, 0)) >= ${parseFloat(req.query.min_ratio)}` : '';

  connection.query(`
    WITH max_year AS (
      SELECT MAX(year) AS year FROM acs_income
    ),
    max_date AS (
      SELECT MAX(date) AS date FROM zhvi_value
    ),
    latest_income AS (
      SELECT region_id, household_income,
             NTILE(4) OVER (ORDER BY household_income DESC) AS income_quartile
      FROM acs_income
      WHERE year = (SELECT year FROM max_year)
    ),
    latest_home AS (
      SELECT region_id, value
      FROM zhvi_value
      WHERE date = (SELECT date FROM max_date)
    )
    SELECT r.region_id, r.region_name, r.state_name, i.household_income, h.value,
           ROUND((h.value / NULLIF(i.household_income, 0))::numeric, 2) AS affordability_ratio
    FROM latest_income i
    JOIN latest_home h USING (region_id)
    JOIN region r USING (region_id)
    WHERE i.income_quartile = 1 ${stateFilter} ${minRatio}
    ORDER BY affordability_ratio DESC
    ${limit};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

// Route 9: GET /regions/:region_id/home-value-growth
const home_value_growth = async function(req, res) {
  const region_id = req.params.region_id;
  const startDate = req.query.start_date ? `AND b.date >= '${req.query.start_date}'` : '';
  const endDate = req.query.end_date ? `AND b.date <= '${req.query.end_date}'` : '';

  // Filter z.region_id early in the CTE to optimize performance
  connection.query(`
    WITH base AS (
      SELECT z.region_id, z.date, z.value,
             LAG(z.value) OVER (PARTITION BY z.region_id ORDER BY z.date) AS prev_value
      FROM zhvi_value z
      WHERE z.region_id = ${region_id}
    )
    SELECT r.region_id, r.region_name, r.state_name, b.date, b.value, b.prev_value,
           ROUND(( ((b.value - b.prev_value) / NULLIF(b.prev_value, 0)) * 100 )::numeric, 2) AS pct_growth
    FROM base b
    JOIN region r USING (region_id)
    WHERE 1=1 ${startDate} ${endDate}
    ORDER BY b.region_id, b.date;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

// Route 10: GET /regions/:region_id/similar
const similar_regions = async function(req, res) {
  const target_id = req.params.region_id;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const stateFilter = req.query.state_name ? `AND b.state_name = '${req.query.state_name}'` : '';

  connection.query(`
    WITH max_year AS (
      SELECT MAX(year) AS year FROM acs_income
    ),
    max_date AS (
      SELECT MAX(date) AS date FROM zhvi_value
    ),
    base AS (
      SELECT i.region_id, r.region_name, r.state_name, i.household_income, z.value
      FROM acs_income i
      JOIN zhvi_value z USING (region_id)
      JOIN region r USING (region_id)
      WHERE i.year = (SELECT year FROM max_year)
        AND z.date = (SELECT date FROM max_date)
    ),
    target AS (
      SELECT * FROM base
      WHERE region_id = ${target_id}
    )
    SELECT b.region_id, b.region_name, b.state_name, b.household_income, b.value,
           ABS(b.household_income - t.household_income) + ABS(b.value - t.value) AS similarity_score
    FROM base b
    JOIN target t ON TRUE
    WHERE b.region_id <> t.region_id ${stateFilter}
    ORDER BY similarity_score ASC
    LIMIT ${limit};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Invalid request" });
    } else {
      res.json({ results: data.rows });
    }
  });
}

module.exports = {
  region_count,
  income_average_by_year,
  home_values_latest,
  rankings_home_values,
  rankings_income,
  states_average_home_values,
  rankings_affordability,
  high_income_poor_affordability,
  home_value_growth,
  similar_regions
}