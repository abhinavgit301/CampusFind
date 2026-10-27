# CampusFind — College Lost & Found Platform

CampusFind is a dedicated, secure, and modern web application built for college campuses to help students report lost items, post found items, search existing listings, contact finders, and coordinate returning items to their rightful owners.

Previously, lost-and-found notifications were scattered across high-noise WhatsApp groups where messages quickly get buried. CampusFind provides one centralized, privacy-conscious platform with structured workflows and deterministic matching.

---

## 1. Core Features & Capabilities

- **Public Browsing without Sign-In**: Anyone can search and filter listings by category, location, and date without logging in.
- **Secure JWT Authentication**: Express backend issues short-lived signed JWTs (~15 min) and rotating refresh sessions (~7 days) transported via secure `HttpOnly` cookies.
- **Conditional Holding Rules**:
  - **Macro Campus Reception**: High-value or custody items deposited at central reception disclose zero student phone numbers or room numbers. Owners are instructed to collect directly from the reception counter with their student ID.
  - **With Finder (Personal Custody)**: Requires verified phone number, explicit consent checkbox, and only exposes details explicitly approved for that listing.
- **Student Privacy by Default**: Lost-item posts never automatically publish phone numbers or room numbers.
- **5-Signal Deterministic Matching Engine**: Computes weighted similarity across Category (20%), Text Description (30%), Campus Location (20%), Timeline Proximity (15%), and Item Attributes (15%). Renormalizes weights when signals are missing.
- **In-Website Notification Center**: Real-time unread counter and alert drawer without third-party email, SMS, or WhatsApp dependencies.
- **Moderator Dashboard**: Proctor panel for putting suspicious listings under review, restoring reports, suspending abusive accounts, and reviewing full audit logs.
- **Zero-Config Local Fallback**: Automatically initializes an embedded in-memory MongoDB instance with pre-seeded campus listings if no `MONGODB_URI` is provided, while seamlessly connecting to MongoDB Atlas in production.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas / In-Memory MongoDB (Mongoose ORM) |
| **Authentication** | JWT (`jsonwebtoken`), Bcrypt password hashing, Rotating Refresh Sessions |
| **Cookies** | Secure, HttpOnly, SameSite=Lax Cookies |
| **Image Storage** | Local Multipart Storage (`uploads/`) with Supabase Storage compatibility |

---

## 3. Pre-Seeded Test Accounts

When running locally, the database is auto-seeded with test data and accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Student (Reporter)** | `student@campus.edu` | `Password123!` | Alex Sharma (Uniworld 1, Rm 304) |
| **Student (Finder)** | `finder@campus.edu` | `Password123!` | Priya Patel (Uniworld 2, Rm 112) |
| **Moderator** | `moderator@campus.edu` | `AdminSecret123!` | Chief Proctor Office (Admin-201) |

*Tip: The Sign-In modal includes 1-click buttons to automatically fill these demo credentials.*

---

## 4. Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

1. **Start the API server (Port 4000):**
   ```bash
   cd server
   npm run dev
   ```
   *The server starts up and connects to MongoDB Atlas (if configured in `server/.env`) or boots the local In-Memory MongoDB engine automatically.*

2. **Start the Vite frontend client (Port 5173):**
   ```bash
   cd client
   npm run dev
   ```

3. Open **`http://localhost:5173`** in your browser.

---

## 5. Environment Variables

### Backend (`server/.env`)
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=                  # Leave blank for auto in-memory dev database or provide Atlas URI
APP_ORIGIN=http://localhost:5173

JWT_ISSUER=campusfind-api
JWT_AUDIENCE=campusfind-web
JWT_ACCESS_TTL_SECONDS=900     # 15 minutes
JWT_ACCESS_SECRET=your_strong_secret_key_here

REFRESH_TOKEN_TTL_DAYS=7

# Optional Supabase storage
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=campusfind-photos
```

---

## 6. Architecture & Security Model

```text
React Client (Port 5173)
       │
       │ HTTPS / Same-Origin Proxy with HttpOnly Cookies
       ▼
Express API Server (Port 4000)
       ├── authenticate middleware (verifies JWT, checks user active status)
       ├── requireRole middleware (enforces STUDENT or MODERATOR)
       ├── privacy sanitizer (filters phone numbers based on holding rules)
       └── 5-signal match service
       │
       ▼
MongoDB Atlas / In-Memory Server
```

### Security Guardrails
1. **Never trust frontend user IDs**: `req.user.id` is derived strictly from verified JWT payloads.
2. **Role escalation prevention**: Public registration always assigns `STUDENT`. `MODERATOR` accounts cannot be created publicly.
3. **Session revocation**: User account suspension immediately revokes all active auth session families.
4. **Token rotation**: Refresh tokens rotate on every renewal. If an old token is reused, the entire session family is revoked.

---

## 7. Pilot Locations

The initial campus rollout is configured for:
- **Macro Campus Central Reception** (Primary safe custody desk)
- **Uniworld 1 Hostel**
- **Uniworld 2 Hostel**
- **Campus Library & Sports Ground**
