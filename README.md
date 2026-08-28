# InsightFlow

InsightFlow is a full-stack data analytics platform that allows users to upload, manage, and dynamically analyze CSV datasets. Built with a React frontend and a Django REST Framework backend, it leverages Pandas for on-the-fly data aggregation and type detection, providing an enterprise-grade data visualization experience.

Live Demo: https://insight-flow-nu.vercel.app/

## Key Features

* **Dynamic Data Analysis:** Upload any CSV file. The backend automatically detects numeric and categorical columns using Pandas.
* **Interactive Charting:** Users can dynamically select X-axis and Y-axis variables and choose aggregation functions (Sum, Mean, Count) to visualize their data instantly.
* **Persistent Dataset Management (CRUD):** Historical dataset uploads are securely saved in PostgreSQL, allowing users to revisit, re-analyze, or delete previously uploaded data.
* **Raw Data Preview:** View a paginated grid of the raw CSV data directly in the dashboard.
* **Secure Authentication:** JWT-based authentication using HTTP-only, secure cookies prevents XSS attacks and ensures secure cross-origin communication between the frontend and backend.
* **Automated Testing:** Comprehensive unit and integration testing suite built with Pytest.

## Technology Stack

### Frontend
* **Framework:** React.js (Vite)
* **Routing:** React Router DOM
* **Visualization:** Recharts
* **Styling:** Vanilla CSS with custom design system

### Backend
* **Framework:** Django & Django REST Framework (DRF)
* **Database:** PostgreSQL
* **Data Processing:** Pandas
* **Authentication:** SimpleJWT (Cookie-based)
* **Testing:** Pytest & Pytest-Django
* **Production Server:** Gunicorn & WhiteNoise

## Local Development Setup

To run this project locally, Docker and Docker Compose are required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhishek720777/InsightFlow.git
   cd InsightFlow
   ```

2. **Start the application using Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   * Frontend: http://localhost:5173
   * Backend API: http://localhost:8000

## Running Tests

The backend test suite includes 20 integration tests covering authentication, file uploading, data analysis, and CRUD operations. 

To run the test suite locally using Docker:
```bash
docker-compose run --rm backend pytest api/tests/ -v
```

## Deployment Architecture

The application is deployed across two platforms to ensure optimal performance and scalability:
* **Frontend:** Hosted on Vercel for fast global edge delivery.
* **Backend:** Hosted on Render as a Python Web Service, connected to a managed PostgreSQL database. Cross-Origin Resource Sharing (CORS) and CSRF trusted origins are configured to securely connect the two domains.
