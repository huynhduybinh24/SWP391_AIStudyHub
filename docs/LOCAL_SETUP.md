# Local Development Setup Guide

Follow these steps to set up and run the application locally.

## Prerequisite Setup

### 1. Pull Latest Code
Ensure you have the latest code from the repository:
```powershell
git checkout main
git pull
```

### 2. Copy Local Configurations
Run the setup script from the root directory to generate local configurations:
```powershell
.\scripts\setup-local.ps1
```
This copies the templates to:
- `BackEnd/src/main/resources/application-local.properties`
- `FrontEnd/.env.local`

### 3. Edit Configurations
Open `BackEnd/src/main/resources/application-local.properties` and customize details like:
- MySQL database password (`spring.datasource.password`)
- External integration client secrets (Google, Gemini, OpenAI, Stripe)

## Running the Application

### Backend Setup
Run the following script from the root directory to compile and start the backend:
```powershell
.\scripts\run-backend-local.ps1
```
- Backend runs at: `http://localhost:8080`

### Frontend Setup
Navigate to the frontend folder, install dependencies, and start the development server:
```powershell
cd FrontEnd
npm install
npm run dev
```
- Frontend runs at: `http://localhost:5173`

## Important Rules
- **DO NOT** commit your local configuration files (`application-local.properties`, `.env.local`, or any JSON credentials files like `google-credentials.json`).
- These are listed in `.gitignore` to prevent accidental commits.
