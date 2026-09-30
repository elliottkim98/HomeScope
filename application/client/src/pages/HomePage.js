import { useEffect, useState } from 'react';
import { Container, Divider, Typography, Grid } from '@mui/material';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';

const config = require('../config.json');

// Topology map of the US states
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function HomePage() {
  const [stateData, setStateData] = useState([]);
  const [totalRegions, setTotalRegions] = useState(0);

  useEffect(() => {
    
    fetch(`http://${config.server_host}:${config.server_port}/regions/count`)
      .then(res => res.json())
      .then(resJson => setTotalRegions(resJson.total_regions))
      .catch(err => console.error(err));

    fetch(`http://${config.server_host}:${config.server_port}/states/average_home_values`)
      .then(res => res.json())
      .then(resJson => {
        setStateData(resJson.results);
      })
      .catch(err => console.error(err));
  }, []);

  const colorScale = scaleQuantile()
    .domain(stateData.map(d => d.avg_home_value))
    .range([
      "#e3f2fd", "#bbdefb", "#90caf9", "#64b5f6", 
      "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0"
    ]);

// Standard mapping of full state names to abbreviations
  const stateAbbreviations = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC"
  };

  const getStateValue = (geoName) => {
  
    const dbStateName = stateAbbreviations[geoName] || geoName; 
    
    // Find the state in our fetched SQL data
    const state = stateData.find(s => s.state_name === dbStateName);
    
    return state ? state.avg_home_value : null;
  };

  return (
    <Container>
      <Typography variant="h3" gutterBottom sx={{ mt: 4 }}>
        US Housing Affordability Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Analyzing economic data across {totalRegions.toLocaleString()} regions.
      </Typography>
      
      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" gutterBottom>
        Average Home Value by State
      </Typography>
      
      <Grid container justifyContent="center">
        <Grid item xs={12} md={10}>
          <ComposableMap projection="geoAlbersUsa">
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const stateValue = getStateValue(geo.properties.name);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={stateValue ? colorScale(stateValue) : "#EEE"}
                      stroke="#FFF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#F53", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => {
                        console.log(`${geo.properties.name}: $${stateValue}`);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </Grid>
      </Grid>
    </Container>
  );
};