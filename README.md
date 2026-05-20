# SignaLab MVP

SignaLab is a React/Vite MVP for a neurodata pipeline dashboard. It currently demonstrates raw data ingest, post-experiment time-series synchronization, processing jobs, QC reports, signal visualization, and standardized dataset browsing with mock lab data.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   The app will be available at `http://localhost:5173` (or the port shown in the terminal)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

- `src/main.jsx` - React entry point
- `src/dashboard/Dashboard.jsx` - Main dashboard shell and active view state
- `src/dashboard/appConfig.jsx` - Navigation and view registry
- `src/dashboard/constants.js` - Shared dashboard constants
- `src/dashboard/utils.js` - Shared format, count, and ingest detection helpers
- `src/dashboard/mockData.js` - Mock sessions, jobs, QC reports, and datasets
- `src/dashboard/views/` - Top-level product views
- `src/index.css` - Tailwind CSS styles
- `index.html` - HTML template

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
