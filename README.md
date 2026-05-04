# Byte Influencer - Project Overview

## Project Purpose

**Byte Influencer** is a comprehensive, full-stack influencer marketing management platform designed to help agencies, brands, and content creators discover, track, and manage digital partnerships. It securely aggregates real-time data across major social media platforms (Instagram, YouTube, TikTok, and Facebook) into **Unified Creator Profiles**. 

Recently expanded into a multi-tenant application, the platform now features a robust **User Authentication System** and **Role-Based Access Control (RBAC)**. This allows individual users to maintain isolated, private portfolios of influencers and clients, while providing administrators with a global overview and powerful user management capabilities via dedicated analytics dashboards.

---

## Key Features

### User Authentication & Authorization
- **Secure Registration & Login**: JWT-based stateless authentication.
- **Session Persistence**: Auth state is maintained via `localStorage`, ensuring a seamless experience across page reloads.
- **Account Protection**: Passwords are securely hashed via `bcryptjs` before database insertion.

### Role-Based Access Control (RBAC)
- **Multi-Tenant Isolation**: Regular users can only interact with their own imported influencers and created clients.
- **Global Administrator Rights**: Admins possess elevated permissions allowing full visibility across all system data.
- **Protected Routing**: Specialized `PrivateRoute` and `AdminRoute` wrappers guard frontend navigation, automatically redirecting unauthorized access attempts.

### User Profile Management
- **Profile Center**: Dedicated dashboard for users to view account details and membership duration.
- **Information Updates**: Users can dynamically edit their usernames.
- **Security Control**: In-app password change mechanism requiring current password validation.
- **Account Deletion**: Users can permanently delete their accounts, triggering cascading cleanup of their data.

### Admin Dashboard & User Management
- **Global Analytics**: Comprehensive administrative dashboard showcasing system-wide user adoption, total reach, and platform-level insights.
- **User Oversight**: Full CRUD interface for administrators to view, edit, or delete any registered user account.
- **Role Delegation**: Secure capability for admins to promote regular users to admin status.

### Influencer Portfolio Management
- **Multi-Platform Import**: Rapid data ingestion via URLs for Instagram, YouTube, TikTok, and Facebook.
- **Unified Creator Profiles**: Automatic merging of multiple platform accounts into a single creator entity based on normalized handles.
- **Automated Duplicate Prevention**: Strict index-level handling prevents duplicate creator records.

### Client Campaign Tracking
- **CRM Features**: Manage brand partnerships, campaign statuses (Active/Inactive), and budget allocations.
- **Lifecycle Tracking**: Full CRUD management linking specific campaigns to their designated budgets and metrics.

### Real-time Analytics & Dashboards
- **Role-Specific Dashboards**: Tailored views depending on authorization level (User vs. Admin).
- **Interactive Visualizations**: Dynamic charts powered by **Recharts**, depicting platform distribution, engagement trends, and active vs. inactive ratios.
- **Growth Metrics**: Real-time aggregation of follower counts, average engagement rates, and platform specific metrics.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | Core UI library with strict mode |
| **Vite** | Fast, modern build tool and development server |
| **React Router DOM v7** | Client-side routing framework |
| **Tailwind CSS v4** | Utility-first styling framework |
| **DaisyUI** | Component library for Tailwind (buttons, inputs, modals) |
| **Recharts** | Composable charting library for dashboard visualizations |
| **Axios** | Promise-based HTTP client for API interactions |
| **Lucide React** | Consistent, modern icon set |
| **React Hot Toast** | Elegant notification system |

### Backend
| Technology | Purpose |
|------------|---------|
| **Express.js** | Minimalist web framework for Node.js |
| **MongoDB + Mongoose** | NoSQL database with strict schema modeling |
| **JSON Web Tokens (JWT)** | Secure, stateless authentication token generation |
| **Bcryptjs** | Cryptographic hashing for passwords |
| **Axios** | Server-side requests to external platform APIs |
| **dotenv** | Environment variable management |
| **CORS** | Cross-origin resource sharing configuration |

---

## Authentication System

### Registration
The registration flow requires a unique email and password.
1. The server validates email uniqueness.
2. The password is hashed using `bcryptjs` (salt rounds: 10) in a Mongoose `pre-save` hook.
3. Upon creation, a JWT is signed containing the user's `id` and `role`.
4. The client stores this token in `localStorage` and updates the React Context.

### Login & Token Management
1. The user provides credentials, which are compared against the hashed database entry.
2. If validated, a new JWT is issued (typically expiring in 30 days).
3. The frontend intercepts API calls via Axios interceptors or service headers, attaching `Bearer <token>` to the `Authorization` header.
4. On application load, `AuthContext` validates the token via the `/api/auth/me` endpoint to seamlessly restore the session.

### Password Management
Changing a password requires the user to submit both their `currentPassword` and `newPassword`. The backend verifies the current password hash before applying a new hash to the new password, ensuring unauthorized changes cannot occur even if a session is left open.

---

## Authorization & Role-Based Access

### User Roles
- **User (`user`)**: The default role. Restricted strictly to records where the `createdBy` field matches their user ID.
- **Admin (`admin`)**: Elevated role. Bypasses the `createdBy` filter, granting full access to the entire database collections.

### Data Filtering
Data isolation is strictly enforced at the database query level inside the Express controllers. 
```javascript
// Example of data filtering logic
const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
const data = await Model.find(query);
```
This ensures a `user` can never accidentally (or maliciously) fetch or modify another user's influencers or clients.

### Admin Operations
Admins have access to an exclusive `/admin/users` interface where they can:
- View the entire user base.
- Edit usernames or emails.
- Promote users to the `admin` role.
- Delete user accounts entirely.

---

## Dashboard System

### User Dashboard
Located at `/`, the `UserDashboard` is rendered for users. It visualizes personal portfolio data:
- **Metrics**: Total owned influencers, owned clients, total followers accumulated, and average engagement rate.
- **Charts**: 
  - Influencers by Platform (Bar Chart)
  - Influencer Status (Active/Inactive Donut Chart)
  - Engagement Rate Trend (Line Chart)
  - Niches Distribution (Horizontal Bar Chart)
- **Data Source**: Fetched via `/api/dashboard/user` which aggregates data exclusively matching `createdBy: req.user.id`.

### Admin Dashboard
Located at `/`, the `AdminDashboard` is rendered for administrators. It provides a macro-view of the platform:
- **Metrics**: Total registered users, global influencer count, global client count, and platform-wide reach.
- **Charts**:
  - Platform Distribution (Pie Chart)
  - User Roles (Donut Chart)
  - Client Status & Budget Overview (Bar Chart)
  - Platform Growth Trends (Line Chart comparing new users vs new influencers)
- **Data Source**: Fetched via `/api/dashboard/admin` which performs global database aggregations.

---

## Project Structure

### Frontend (`Byte-Influencer-Client`)
```text
src/
├── assets/             # Static assets (images, SVGs)
├── components/         # Reusable UI architecture
│   ├── clients/        # Client table, rows, and badges
│   ├── influencers/    # Influencer table, metrics, and platform tags
│   ├── dashboard/      # Recharts wrappers and stat cards
│   ├── modals/         # CRUD dialogs (Import, Edit, Delete, Admin Actions)
│   ├── NavBar.jsx      # Navigation, theme toggle, dynamic auth links
│   ├── Pagination.jsx  # Page navigation component
│   ├── Footer.jsx      # Global footer
│   └── LoadingSpinner.jsx # Unified loading state UI
├── layouts/            # Layout wrappers
│   └── RootLayout.jsx  # Application shell
├── context/            # React Context
│   └── AuthContext.jsx # Global auth, session persistence, logout logic
├── pages/              # Main route views
│   ├── dashboard/      # Role-specific dashboard layouts
│   ├── Home.jsx        # Landing page & Dashboard router
│   ├── InfluencerList.jsx # Personal/Global creator list
│   ├── InfluencerProfile.jsx # Detailed creator stats
│   ├── ClientList.jsx  # Personal/Global client list
│   ├── UserManagement.jsx # [Admin] Global user control
│   ├── Login.jsx       # Auth login
│   ├── Register.jsx    # Auth registration
│   └── Profile.jsx     # User account settings
├── routes/             # Routing configurations
│   ├── router.jsx      # createBrowserRouter config
│   ├── PrivateRoute.jsx # Guard for authenticated users
│   └── AdminRoute.jsx  # Guard for admin users
└── services/           # Axios API integrations
```

### Backend (`Byte-Influencer-Server`)
```text
Byte-Influencer-Server/
├── config/             # DB connections
├── controllers/        # Request handling and business logic
│   ├── authController.js       # Auth & profile management
│   ├── adminController.js      # Global user management
│   ├── dashboardController.js  # Role-specific data aggregations
│   ├── influencerController.js # Ownership-aware influencer logic
│   └── clientController.js     # Ownership-aware client logic
├── middleware/         # Custom Express middlewares
│   └── authMiddleware.js       # JWT validation (`protect`, `isAdmin`)
├── models/             # Mongoose schemas
│   ├── user.js         # Auth and role definitions
│   ├── influencer.js   # Unified creator schema
│   └── client.js       # Brand schema
├── routes/             # Express routers
│   ├── authRoutes.js   
│   ├── adminRoutes.js
│   ├── dashboardRoutes.js
│   ├── influencerRoutes.js
│   └── clientRoutes.js
├── services/           # RapidAPI/Google API external fetching logic
└── server.js           # Express initialization
```

---

## Database Schema

### User Model
```javascript
{
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: Date,
  updatedAt: Date
}
```

### Influencer Model
```javascript
{
  name: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  platforms: [{
    platformName: { type: String, enum: ['YouTube', 'TikTok', 'Instagram', 'Facebook'] },
    followers: Number,
    niche: String,
    status: { type: String, enum: ['Active', 'Inactive'] },
    metrics: { avgLikes: Number, avgViews: Number, engagementRate: Number }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: Date,
  updatedAt: Date
}
```

### Client Model
```javascript
{
  name: { type: String, required: true },
  campaign: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stats: {
    budget: Number,
    influencersCount: Number,
    reach: Number,
    engagementRate: Number,
    campaignDuration: { startDate: Date, endDate: Date },
    conversions: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Creates a new user account and returns JWT. |
| POST | `/login` | No | Authenticates user and returns JWT. |
| GET | `/me` | Yes | Validates token and returns current user profile. |
| PATCH | `/profile` | Yes | Updates the authenticated user's username. |
| DELETE | `/profile` | Yes | Deletes the authenticated user account and their data. |
| PATCH | `/change-password` | Yes | Updates user password, requiring current password. |

### Dashboard Routes (`/api/dashboard`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/user` | Yes | Returns personal data aggregations for the user dashboard. |
| GET | `/admin` | Yes (Admin) | Returns platform-wide data aggregations for the admin dashboard. |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/users` | Yes (Admin) | Returns all registered users. |
| PATCH | `/users/:id` | Yes (Admin) | Updates a specific user's basic profile details. |
| PATCH | `/users/:id/role` | Yes (Admin) | Promotes a user to the admin role. |
| DELETE | `/users/:id` | Yes (Admin) | Deletes a user account and purges their data. |

### Influencer Routes (`/api/influencers`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | Yes | Returns paginated list of influencers (filtered by role). |
| GET | `/:id/profile` | Yes | Returns a detailed unified profile for an influencer. |
| POST | `/import-*` | Yes | Imports metrics from external APIs (ig/youtube/tiktok/facebook). |
| PATCH | `/:id` | Yes | Updates identity fields or platform data. |
| DELETE | `/:id` | Yes | Deletes the entire unified creator profile. |
| DELETE | `/:id/platform/:name` | Yes | Removes a specific social platform from a profile. |

### Client Routes (`/api/clients`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | Yes | Returns paginated list of clients (filtered by role). |
| POST | `/` | Yes | Creates a new brand client. |
| PATCH | `/:id` | Yes | Updates an existing client's details and stats. |
| DELETE | `/:id` | Yes | Deletes a client profile. |

---

## Environment Variables

### Backend (`.env`)
```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/byte_influencer

# Authentication
JWT_SECRET=your_secure_random_jwt_string

# Server
PORT=5000

# External API Keys (RapidAPI & Google)
RAPIDAPI_KEY=your_rapidapi_key
YOUTUBE_API_KEY=your_google_cloud_youtube_key
FACEBOOK_API_KEY=your_rapidapi_key
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Getting Started

### 1. Database Setup
Ensure you have access to a MongoDB instance or MongoDB Atlas cluster. Whitelist your current IP address in the network settings to prevent connection errors.

### 2. Backend Setup
```bash
cd Byte-Influencer-Server
npm install
# Create a .env file and populate it with the required variables listed above
npm run dev
# Server should now be running on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd Byte-Influencer-Client
npm install
# Create a .env file and populate it with VITE_API_URL
npm run dev
# Vite will start the frontend on http://localhost:5173
```

---

## Security Considerations

- **Password Hashing**: Stored passwords are mathematically irreversible due to `bcryptjs` hashing. Plaintext passwords are never logged or stored.
- **JWT Protection**: Tokens are validated on every protected API call using Express middleware. Tampered tokens automatically reject the request.
- **Data Isolation**: The `createdBy` filter is injected at the deepest level of the controller logic, meaning frontend manipulation cannot bypass data ownership rules.
- **Role Auditing**: Admin endpoints strictly require the `role === 'admin'` check via the `isAdmin` middleware, protecting destructive endpoints from standard users.
- **API Key Masking**: External API keys remain strictly on the Node.js server and are never exposed to the React frontend.
