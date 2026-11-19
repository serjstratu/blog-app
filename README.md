# Blog App

A personal project for learning and exploring modern React development by building a working blog application. The frontend is built with React and TypeScript; the backend is a separately developed REST API using Python and FastAPI, with PostgreSQL for data storage.

The project is evolving as new features and experiments are added.

## Features

- Browse the latest published posts at `/blog`.
- Navigate through paginated post listings.
- Open a post detail page at `/post/:id`.
- Like or dislike posts when logged in.
- Read paginated comments and threaded replies as a guest or logged-in user.
- Add comments and replies when logged in.
- Delete comments as an administrator.
- Create posts as a user with the `admin` or `editor` role at `/add/`.
- Save a new post as a draft or publish it, with optional category, tags, cover image, excerpt, and featured flag.
- Log in using an email or username and password, with cookie-based refresh and logout.
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
- Day.js for date formatting and sorting
- SweetAlert2 for destructive-action confirmation dialogs
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

Clone and run the API by following the setup instructions in the [backend repository](https://github.com/serjstratu/blog-api-python). The frontend expects it at `http://localhost:8000` by default. Use `localhost` consistently for both frontend and API URLs so the browser sends the refresh cookie.

### 2. Start the frontend

Install dependencies:

```bash
npm install
```

Create a local `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api
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
| `/add/` | Create a post (admin/editor roles only) |

## API endpoints used

The frontend currently calls these endpoints relative to `VITE_API_URL`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Authenticate a user |
| `POST` | `/auth/refresh` | Refresh the access token using the HttpOnly refresh cookie |
| `POST` | `/auth/logout` | Clear the refresh cookie and log out |
| `GET` | `/posts?limit=20&offset=0` | Load the blog listing |
| `GET` | `/posts/{id}` | Load an individual post |
| `POST` | `/posts` | Create a post (admin/editor roles) |
| `POST` | `/posts/{id}/like` | Like a post |
| `POST` | `/posts/{id}/dislike` | Dislike a post |
| `GET` | `/comments?postId={id}&limit=20&offset=0` | Load paginated comments and nested replies |
| `POST` | `/posts/{id}/comments` | Add a comment or reply (`parentId` is optional/null) |
| `DELETE` | `/comments/{id}` | Delete a comment (admin role) |
| `GET` | `/users/{id}` | Load and refresh a user profile |
| `PATCH` | `/users/{id}` | Update profile name, bio, and phone |
| `POST` | `/users/{id}/avatar` | Upload a profile avatar as multipart form data (`file`) |

The auth provider manages the access token and user session in browser `sessionStorage`. Login, refresh, and logout requests include browser credentials so the backend can set, rotate, and clear the HttpOnly refresh-token cookie. Use the same hostname (`localhost`) for the frontend and API during local development; mixing `localhost` and `127.0.0.1` prevents the browser from sending the cookie as expected. The API must enable credentialed CORS for the frontend origin.

## Project structure

```text
src/
├── components/          # Shared layout, comments, and pagination UI
├── config/              # API configuration and shared fetch helpers
├── features/auth/       # Login form, validation, and auth service
├── pages/               # Route pages and page-specific components/styles
├── providers/            # App router and authentication context
├── types/                # Shared API and auth data types
└── utils/                # Date formatting and sorting helpers
```

## Project goal

This application is a practical place to learn the React ecosystem, try current patterns, and build experience with component architecture, state management, API integration, and testing. The About page contains the in-app project introduction.
