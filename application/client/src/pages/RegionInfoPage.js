import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Container, Typography, Grid, Paper, Divider, List, ListItem, ListItemText } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const config = require('../config.json');

export default function RegionInfoPage() {
  const { region_id } = useParams();
  const [growthData, setGrowthData] = useState([]);
  const [similarRegions, setSimilarRegions] = useState([]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/regions/${region_id}/home_value_growth`)
      .then(res => res.json())
      .then(resJson => setGrowthData(resJson.results));

    fetch(`http://${config.server_host}:${config.server_port}/regions/${region_id}/similar`)
      .then(res => res.json())
      .then(resJson => setSimilarRegions(resJson.results));
  }, [region_id]);

  const latestInfo = growthData[growthData.length - 1] || {};

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h3">{latestInfo.region_name}, {latestInfo.state_name}</Typography>
      <Divider sx={{ my: 3 }} />

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>Home Value Trend</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#3f51b5" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>Comparable Markets</Typography>
            <List>
              {similarRegions.map((region) => (
                <ListItem 
                  key={region.region_id} 
                  component={NavLink} 
                  to={`/regions/${region.region_id}`}
                  sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: '#f5f5f5' } }}
                >
                  <ListItemText 
                    primary={`${region.region_name}, ${region.state_name}`} 
                    secondary={`Similarity Score: ${Math.round(region.similarity_score).toLocaleString()}`} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}