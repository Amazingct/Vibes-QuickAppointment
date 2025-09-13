# VCP Backend API

A production-ready Flask backend with JWT authentication and user management.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ with conda
- PostgreSQL database running
- Conda environment named 'vcp'

### Setup Environment

1. **Activate conda environment:**
   ```bash
   conda activate vcp
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   source set_env.sh
   ```

4. **Run the server:**
   ```bash
   python main.py
   ```

   **OR use the convenience script:**
   ```bash
   ./run_server.sh
   ```

## 📊 Database Setup

The database migration has already been run, but if you need to run it again:

```bash
# Initialize migrations (only needed once)
flask --app main db init

# Create and apply migration
python migrate.py "Your migration message"

# Check migration status
python migrate.py --status
```

## 🔐 API Endpoints

### Authentication (/api/auth)
- `POST /signup` - Register new user
- `POST /login` - Login with email/username
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info
- `POST /validate` - Validate JWT token

### Users (/api/users)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /` - List users (with pagination/search)
- `GET /:id` - Get user by ID

### Health Check
- `GET /` - Health check
- `GET /api` - API info

## 📁 Project Structure

```
backend/
├── main.py              # Flask application entry point
├── config.py            # Configuration settings
├── database.py          # Database models (User model)
├── migrate.py           # Migration script
├── requirements.txt     # Python dependencies
├── run_server.sh       # Server startup script
├── set_env.sh          # Environment variable setup
├── blueprints/         # API route blueprints
│   ├── auth.py         # Authentication endpoints
│   └── users.py        # User management endpoints
├── migrations/         # Database migration files
├── docs/              # API documentation
│   └── postman_collection.json
└── utils/             # Utility functions
    ├── files.py       # File operations
    └── mail.py        # Email utilities
```

## 🧪 Testing with Postman

1. Import the collection: `docs/postman_collection.json`
2. The collection will automatically:
   - Set base_url to `http://localhost:5002`
   - Save JWT tokens after login/signup
   - Use saved tokens for protected endpoints

### Example API Calls

**Sign Up:**
```json
POST /api/auth/signup
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Login:**
```json
POST /api/auth/login
{
  "login": "john.doe@example.com",
  "password": "password123"
}
```

## 🔧 Environment Variables

Required environment variables (set automatically by `set_env.sh`):

```bash
DATABASE_URL=postgresql://vcp_user:vcp_password@localhost:5432/vcp_database
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
PORT=5002
```

## 🛡️ Security Features

- **Password hashing** with bcrypt
- **JWT authentication** with access and refresh tokens
- **Input validation** with detailed error messages
- **Email format validation**
- **Secure password requirements** (minimum 6 characters)
- **Username uniqueness** enforcement
- **Account status management** (active/inactive)

## 📝 User Model Fields

- `id` - Primary key
- `email` - Unique email address
- `username` - Unique username
- `password_hash` - Bcrypt hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `avatar_url` - Optional profile picture URL
- `is_active` - Account status
- `is_verified` - Email verification status
- `verification_token` - Email verification token
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login_at` - Last login timestamp

## 🚨 Troubleshooting

**Database connection error:**
- Make sure PostgreSQL is running
- Check DATABASE_URL in environment variables
- Verify database exists and credentials are correct

**Import errors:**
- Ensure conda environment 'vcp' is activated
- Run `pip install -r requirements.txt`

**Migration errors:**
- Run `python migrate.py --status` to check migration state
- Use `python migrate.py --upgrade` to apply pending migrations

## 🌐 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (typical React dev server)
- `http://localhost:5173` (Vite dev server)

Add more origins in the CORS_ORIGINS environment variable.

## 📈 Server Information

- **Default Port:** 5002
- **Debug Mode:** Enabled in development
- **Database:** PostgreSQL
- **Authentication:** JWT with Bearer tokens
- **API Format:** REST JSON

The server will display startup information including configured database and CORS origins when started.
