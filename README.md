# Blog App

A personal project for learning and exploring modern React development by building a working blog application. The frontend is built with React and TypeScript; the backend is a separately developed REST API using Python and FastAPI, with PostgreSQL for data storage.

The project is evolving as new features and experiments are added.

## Features

- Browse the latest published posts at `/blog`.
- Open a post detail page at `/post/:id`.
- Log in using an email or username and password.
- View a user profile at `/user/:id`, including avatar and account details.
- Edit the profile name, bio, and phone number.
- Upload an avatar image.
- Display API and form errors with toast notifications.

## Technology

### Frontend

- React 19
- TypeScript
- Vite 8
- React Router 7
- React Hook Form and Yup for login form handling and validation
- React Toastify for notifications
- Font Awesome icons
- Vitest, Testing Library, and jsdom for tests
- Oxlint for linting

### Backend

- Python
- FastAPI
- PostgreSQL

The backend runs separately from this frontend repository. Use the companion [blog-api-python](https://github.com/serjstratu/blog-api-python) project for the API source code and backend setup instructions. Start the backend before using API-dependent frontend features.

## Requirements

- Node.js compatible with the installed Vite version
- npm
- The [blog-api-python backend](https://github.com/serjstratu/blog-api-python), running locally

## Getting started

### 1. Start the backend

Clone and run the API by following the setup instructions in the [backend repository](https://github.com/serjstratu/blog-api-python). The frontend expects it at `http://127.0.0.1:8000` by default.

### 2. Start the frontend

Install dependencies:

```bash
npm install
```

Create a local `.env` file in the project root:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

`VITE_API_URL` is the API base URL, including the `/api` prefix. The same setting is used for API calls and to resolve relative avatar paths. The application defaults to the URL above if the variable is omitted.

Start the development server:

```bash
npm run dev
```

Vite prints the local frontend URL in the terminal (typically `http://localhost:5173`).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript project checks and build production assets |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |
| `npm run test:coverage` | Run tests with V8 coverage |

## Routes

| Route | Page |
| --- | --- |
| `/` | Home page |
| `/about` | Project purpose and technology overview |
| `/blog` | List of recent posts |
| `/post/:id` | Post details loaded from the API |
| `/user/:id` | User profile and profile editing |

## API endpoints used

The frontend currently calls these endpoints relative to `VITE_API_URL`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/posts?limit=20&offset=0` | Load the blog listing |
| `GET` | `/posts/{id}` | Load an individual post |
| `GET` | `/users/{id}` | Load and refresh a user profile |
| `PATCH` | `/users/{id}` | Update profile name, bio, and phone |
| `POST` | `/users/{id}/avatar` | Upload a profile avatar as multipart form data (`file`) |

Login credentials and the access token are managed by the auth provider. The current session is stored in browser `sessionStorage` and expires according to the API response.

## Project structure

```text
src/
├── components/layout/   # Shared header, footer, and page layout
├── config/              # API configuration
├── features/auth/       # Login form, validation, service, and types
├── pages/               # Route-level pages and their styles
├── providers/            # App router and authentication context
└── types/                # Shared API data types
```

## Project goal

This application is a practical place to learn the React ecosystem, try current patterns, and build experience with component architecture, state management, API integration, and testing. The About page contains the in-app project introduction.
