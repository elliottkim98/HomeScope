import { useEffect, useState } from 'react';
import { Container, Tabs, Tab, Box, Slider, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [limit, setLimit] = useState(25);
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);

  // Mapping tabs to endpoints
  const routes = [
    '/rankings/home_values',
    '/rankings/income',
    '/rankings/affordability'
  ];

  useEffect(() => {
    setLoading(true);
    const stateFilter = state ? `&state_name=${state}` : '';
    fetch(`http://${config.server_host}:${config.server_port}${routes[activeTab]}?limit=${limit}${stateFilter}`)
      .then(res => res.json())
      .then(resJson => {
        console.log("RAW DATA:", resJson.results[0]); 
        const resultsWithId = resJson.results.map((row, idx) => ({ id: idx, ...row }));
        setData(resultsWithId);
        setLoading(false);
      });
  }, [activeTab, limit, state]);

 
const getColumns = () => {
    const baseColumns = [
      { field: 'region_name', headerName: 'Region', width: 250 },
      { field: 'state_name', headerName: 'State', width: 100 },
    ];
    const formatCurrency = (params) => {
      const val = params?.value ?? params; 
      return val ? `$${Number(val).toLocaleString()}` : '';
    };

    if (activeTab === 0) {
      return [
        ...baseColumns,
        { field: 'value', headerName: 'Home Value', width: 150, valueFormatter: formatCurrency },
      ];
    } else if (activeTab === 1) {
      return [
        ...baseColumns,
        { field: 'household_income', headerName: 'Income', width: 150, valueFormatter: formatCurrency },
        { field: 'income_rank', headerName: 'Rank', width: 100 },
      ];
    } else {
      return [
        ...baseColumns,
        { field: 'value', headerName: 'Home Value', width: 150, valueFormatter: formatCurrency },
        { field: 'household_income', headerName: 'Income', width: 150, valueFormatter: formatCurrency },
        { field: 'affordability_ratio', headerName: 'Ratio', width: 120 },
      ];
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Market Rankings</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Home Values" />
          <Tab label="Household Income" />
          <Tab label="Affordability Ratio" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, mb: 4, alignItems: 'center' }}>
        <Box sx={{ width: 200 }}>
          <Typography gutterBottom>Results Limit: {limit}</Typography>
          <Slider value={limit} min={10} max={100} step={5} onChange={(e, val) => setLimit(val)} />
        </Box>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>State</InputLabel>
          <Select value={state} label="State" onChange={(e) => setState(e.target.value)}>
            <MenuItem value="">All States</MenuItem>
            <MenuItem value="NJ">New Jersey</MenuItem>
            <MenuItem value="PA">Pennsylvania</MenuItem>
            <MenuItem value="CA">California</MenuItem>
            {/* Add more states as needed */}
          </Select>
        </FormControl>
      </Box>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid rows={data} columns={getColumns()} loading={loading} pagination autoHeight />
      </div>
    </Container>
  );}