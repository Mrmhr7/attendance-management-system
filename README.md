# Attendance Management System (MERN)

A full-stack Attendance Management System with Employee, Manager and Admin roles — live selfie-based punch in/out, geolocation capture, working-hours tracking, overtime workflow, manual attendance validation, dashboards and daily reports.

> Built as a technical assessment deliverable. P0 scope (auth, RBAC, punch in/out with camera+location, working hours, overtime, dashboards, validation, daily reports) is fully implemented. P1 (date filters, pagination, polish) is implemented. P2 (geofencing, notifications, Socket.IO, dark mode, PDF/Excel export) is intentionally out of scope — see Limitations.

## 1. Features Implemented

- JWT auth: employee self-registration (always role `employee`), login, `/me`, logout (client-side token clear)
- Role-based authorization end-to-end — role is always re-read from the database on every request, never trusted from the client/JWT payload alone beyond the user id
- Live camera selfie capture (MediaDevices API, no file upload option) + browser Geolocation capture, for both punch-in and punch-out
- Server-generated timestamps; duplicate punch-in, punch-out without punch-in, and duplicate same-day attendance are all prevented (enforced both in the service layer and with a unique DB index)
- Working-hours calculation (Completed ≥ 8h / Incomplete < 8h), with auto-closing of attendance left open for 16+ hours (missed punch-out)
- Overtime request → Manager/Admin review (Approve/Reject) → reflected back on the attendance record; employees cannot review their own requests
- Manual attendance validation workflow (Valid/Invalid + remarks) by Manager/Admin — explicitly does **not** claim a selfie is "verified genuine" automatically
- Employee / Manager / Admin dashboards with live stats
- Daily reports with date filter, pagination, and role-scoped access (own / team / all)
- Manager access is scoped to their assigned team everywhere (attendance, overtime, validation, reports, user list)
- Centralized error handling, Winston logging, request logging, Helmet, CORS allow-list, rate limiting (auth + global), Zod request validation (also strips unknown fields to prevent mass assignment)
- Cloudinary selfie storage in production; falls back to local disk (`backend/uploads`) automatically in development when Cloudinary env vars are not set

## 2. Technology Stack

**Frontend:** React 18 + Vite, JavaScript, Material UI, Redux Toolkit, RTK Query, React Router DOM
**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, Winston, Zod, Helmet, express-rate-limit
**Other:** MediaDevices API, Geolocation API, Cloudinary

## 3. Architecture

```
attendance-management-system/
  backend/
    src/
      config/       env, db, cloudinary
      controllers/  request handlers
      middleware/   auth, validate, error handling, request logger
      models/       User, Attendance, OvertimeRequest
      routes/       REST endpoints
      services/     attendanceService, accessService, imageService (business logic lives here, not in controllers)
      utils/        logger, ApiError, asyncHandler, pagination, dates
      validators/   Zod schemas per resource
      app.js, server.js, seed.js
  frontend/
    src/
      app/          store, theme
      components/   CameraCapture, StatCard, StatusChip, EmptyState, ConfirmDialog
      features/auth/ authSlice
      hooks/        useGeolocation
      layouts/      DashboardLayout (role-aware sidebar)
      pages/        auth/ employee/ manager/ admin/ shared/
      routes/       ProtectedRoute
      services/     apiSlice (RTK Query)
  README.md
```

## 4. Database Models & Relationships

- **User**: `name, email, password (hashed), role [employee|manager|admin], managerId (ref User, employees only), isActive`
- **Attendance**: `employeeId (ref User), date (YYYY-MM-DD), punchIn, punchOut, punchInSelfie, punchOutSelfie, punchInLocation {lat,lng,accuracy}, punchOutLocation, totalWorkingHours, workingHoursStatus, validationStatus, validationRemarks, validatedBy, validatedAt, overtimeStatus, approvedOvertimeHours` — **unique index** on `(employeeId, date)` enforces one record per employee per day
- **OvertimeRequest**: `employeeId (ref User), attendanceId (ref Attendance), requestedHours, reason, status, reviewedBy, reviewedAt, remarks` — a partial unique index prevents more than one active (Pending/Approved) request per attendance record

Relationships: one Manager → many Employees (`User.managerId`); one Employee → many Attendance records; one Attendance → at most one active OvertimeRequest.

## 5. API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public (creates Employee only) |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Authenticated |
| GET | /api/users | Admin, Manager (own team) |
| GET | /api/users/:id | Self / Manager (own team) / Admin |
| POST | /api/users | Admin |
| PUT | /api/users/:id | Admin |
| DELETE | /api/users/:id | Admin (soft delete / deactivate) |
| POST | /api/attendance/punch-in | Employee |
| POST | /api/attendance/punch-out | Employee |
| GET | /api/attendance/today | Employee |
| GET | /api/attendance/my | Employee |
| GET | /api/attendance/team | Manager, Admin |
| GET | /api/attendance/all | Admin |
| GET | /api/attendance/:id | Self / Manager (team) / Admin |
| PATCH | /api/attendance/:id/validate | Manager, Admin |
| POST | /api/overtime | Employee |
| GET | /api/overtime/my | Employee |
| GET | /api/overtime/pending | Manager (team), Admin |
| PATCH | /api/overtime/:id/review | Manager, Admin |
| GET | /api/reports/daily | Employee (own) / Manager (team) / Admin (all) |
| GET | /api/dashboard/stats | role-specific stats |
| GET | /api/health | Public health check |

## 6. Installation & Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod` or a free MongoDB Atlas cluster)

### Backend
```bash
cd backend
npm install
cp .env.example .env     # edit MONGO_URI / JWT_SECRET if needed — a working dev default is already in .env
npm run seed              # creates demo admin/manager/employee accounts
npm run dev                # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_BASE_URL defaults to http://localhost:5000/api
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173`. The camera and geolocation permission prompts require either `localhost` or HTTPS — `localhost` works out of the box.

## 7. Environment Variables

**backend/.env**
```
NODE_ENV, PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, BACKEND_URL, APP_TIMEZONE,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
```
Leave the Cloudinary variables empty for local development — selfies are then written to `backend/uploads/` and served statically. Cloudinary becomes required once `NODE_ENV=production`.

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 8. Demo Login Credentials (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin@123 |
| Manager | manager@example.com | Manager@123 |
| Employee | employee@example.com | Employee@123 |
| Employee | employee2@example.com | Employee@123 |

## 9. Deployment

- **Frontend → Vercel**: set `VITE_API_BASE_URL` to your deployed backend URL; build command `npm run build`, output `dist`.
- **Backend → Render**: set all backend env vars (use a strong `JWT_SECRET`, real Cloudinary credentials, `CLIENT_URL` = your Vercel URL, `NODE_ENV=production`); start command `npm start`.
- **Database → MongoDB Atlas**: create a cluster, add Render's outbound IPs (or `0.0.0.0/0` for simplicity) to network access, and use the SRV connection string as `MONGO_URI`.
- Health check: `GET /api/health`.

Deployment links: *add after deploying* —
Frontend: `TBD` · Backend: `TBD`

## 10. Assumptions & Limitations

- Standard shift is fixed at 8 hours (`backend/src/config/env.js`); not currently configurable per employee.
- An attendance record left open for 16+ hours is auto-closed as "Incomplete" to keep the status accurate; this threshold is configurable (`maxOpenHours`).
- Attendance validation is a manual human decision; the system never claims a selfie is biometrically verified.
- Manager/Admin accounts are not self-serve — create them via `npm run seed` or the Admin → User Management screen (public signup only ever creates Employees).
- P2 items (geofencing, real-time notifications/Socket.IO, dark mode, PDF/Excel export) were deliberately left out to protect P0/P1 scope within the 48-hour window, per the stated priority order.
- JWT auth uses a single access token (no refresh-token rotation) stored in `localStorage`; acceptable for this assessment's scope but worth hardening (httpOnly cookies + refresh tokens) for a production rollout.
