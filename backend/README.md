# Backend (Node + Express + MongoDB)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

On Windows PowerShell use:

```powershell
Copy-Item .env.example .env
```

3. Update `.env` with your MongoDB connection string (`MONGODB_URI`).

4. Start backend server:

```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - health check
- `POST /api/auth/register` - create account in MongoDB
- `POST /api/auth/login` - login and receive JWT token
- `GET /api/auth/me` - get current user from JWT token
- `GET /api/users` - list users from MongoDB
- `POST /api/users` - create user in MongoDB

Default seeded users:
- `admin@demo.com / admin`
- `manager@demo.com / manager`
- `staff@demo.com / staff`
