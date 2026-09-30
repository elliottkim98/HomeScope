const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/regions/count', routes.region_count);
app.get('/income/average_by_year', routes.income_average_by_year);
app.get('/home_values/latest', routes.home_values_latest); 
app.get('/rankings/home_values', routes.rankings_home_values);
app.get('/rankings/income', routes.rankings_income);
app.get('/states/average_home_values', routes.states_average_home_values);
app.get('/rankings/affordability', routes.rankings_affordability);
app.get('/regions/high_income_poor_affordability', routes.high_income_poor_affordability);
app.get('/regions/:region_id/home_value_growth', routes.home_value_growth);
app.get('/regions/:region_id/similar', routes.similar_regions);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
