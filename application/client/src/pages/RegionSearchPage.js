import { useState } from 'react';
import { Container, Button, Typography, Grid, Slider, Card, CardContent, Link } from '@mui/material';
import { NavLink } from 'react-router-dom';

const config = require('../config.json');

export default function RegionSearchPage() {
  const [results, setResults] = useState([]);
  const [minRatio, setMinRatio] = useState(5.0);

  const handleSearch = () => {
    fetch(`http://${config.server_host}:${config.server_port}/regions/high_income_poor_affordability?min_ratio=${minRatio}`)
      .then(res => res.json())
      .then(resJson => setResults(resJson.results));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Region Explorer</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Find regions in the top income quartile that have disproportionately high home prices.
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Minimum Price-to-Income Ratio: {minRatio}</Typography>
          <Slider value={minRatio} min={1} max={15} step={0.5} onChange={(e, val) => setMinRatio(val)} />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" onClick={handleSearch} fullWidth>Explore Markets</Button>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {results.map((region) => (
          <Grid item xs={12} sm={6} md={4} key={region.region_id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">
                  <Link component={NavLink} to={`/regions/${region.region_id}`}>
                    {region.region_name}, {region.state_name}
                  </Link>
                </Typography>
                <Typography color="text.secondary">Ratio: {region.affordability_ratio}</Typography>
                <Typography variant="body2">Home Value: ${region.value?.toLocaleString()}</Typography>
                <Typography variant="body2">Income: ${region.household_income?.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}