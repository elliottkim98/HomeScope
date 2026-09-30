import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { indigo, amber } from '@mui/material/colors';
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import RankingsPage from './pages/RankingsPage';
import RegionSearchPage from './pages/RegionSearchPage';
import RegionInfoPage from './pages/RegionInfoPage';

export const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: amber,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/regions" element={<RegionSearchPage />} />
          <Route path="/regions/:region_id" element={<RegionInfoPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}