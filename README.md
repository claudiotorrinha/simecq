# Oeiras Trophy Dashboard

React/Vite dashboard for tracking SIMECQ athlete and club performance in the Trofeu de Oeiras series.

## Frontend

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Data Update Script

The dashboard data is stored in [`src/data/dashboard_data.json`](src/data/dashboard_data.json) and can be refreshed with [`update_data.py`](update_data.py).

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Refresh data:

```bash
python update_data.py
```

## Notes

- The app currently ships the dashboard data as part of the frontend bundle.
- After updating the JSON, restart the Vite dev server or rebuild the app to ensure the latest data is reflected.
