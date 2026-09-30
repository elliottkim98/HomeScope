# Housing Market Data Analysis Application

This is a full-stack web application for analyzing housing market data across the United States. It integrates Zillow Home Value Index (ZHVI) data and American Community Survey (ACS) income data to provide insights into home values, income trends, affordability rankings, and regional comparisons.

The application features interactive visualizations including maps, charts, and data tables, allowing users to explore housing market trends by region, state, and time period.

## Features

- Regional home value tracking and growth analysis
- Income data visualization by year and region
- Affordability rankings based on home values vs. income
- Interactive map showing geographic data
- Search and filter capabilities for regions
- Data tables with sorting and pagination

## Tech Stack

- **Frontend**: React.js with Material-UI, Recharts for charts, React Simple Maps for geographic visualizations
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Data Processing**: Python with Pandas and SQLAlchemy

## Prerequisites

Before running this application locally, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (comes with Node.js)
- PostgreSQL (v12 or higher)
- Python 3.x with pandas and sqlalchemy libraries

## Local Setup Instructions

###  Backend Setup

1. Navigate to the server directory:
   ```bash
   cd application/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the database configuration in `config.json` to point to your the PostgreSQL instance:
   ```json
   {
     "rds_host": "localhost",
     "rds_port": "5432",
     "rds_user": "your_username",
     "rds_password": "your_password",
     "rds_db": "housing_analysis",
     "server_host": "localhost",
     "server_port": "8080"
   }
   ```

4. Start the server:
   ```bash
   npm start
   ```
   The server will run on http://localhost:8080

###  Frontend Setup

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd application/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The application will open in your browser at http://localhost:3000

## Usage

Once both the server and client are running:

1. Open your browser and go to http://localhost:3000
2. Navigate through the different pages using the navigation bar:
   - **Home**: Overview and key metrics
   - **Rankings**: View rankings by home values, income, and affordability
   - **Region Search**: Search for specific regions
   - **Region Info**: Detailed information about selected regions
   - **Albums**: (Note: This may be a placeholder or misnamed page)

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /regions/count` - Get total number of regions
- `GET /income/average_by_year` - Get average income by year
- `GET /home_values/latest` - Get latest home values
- `GET /rankings/home_values` - Get home value rankings
- `GET /rankings/income` - Get income rankings
- `GET /states/average_home_values` - Get average home values by state
- `GET /rankings/affordability` - Get affordability rankings
- `GET /regions/high_income_poor_affordability` - Get high-income regions with poor affordability
- `GET /regions/:region_id/home_value_growth` - Get home value growth for a region
- `GET /regions/:region_id/similar` - Get similar regions
