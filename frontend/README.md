# Complexhibit Frontend

Frontend application for Complexhibit, built with Next.js.

## Getting Started

### Prerequisites

- Node.js 18+
- Backend services running (see root README)

### Installation

```bash
npm install
```

### Configuration

The application relies on environment variables for API connection.
When running via Docker (from root), these are injected automatically.

For local development:
1. Create a `.env.local` file in this directory.
2. Add the following:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `src/app`: App router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and API clients.
