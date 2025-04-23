# Contestify Backend

This is the backend for the Contestify application, a platform for hosting and participating in coding contests.

## Database Migration: MongoDB to PostgreSQL

The application has been migrated from MongoDB to PostgreSQL with GORM. This provides better schema validation, relationships, and query capabilities.

## Prerequisites

- Go 1.22 or higher
- PostgreSQL 13 or higher
- Docker (for running test cases)

## Setup

1. Clone the repository
2. Set up your PostgreSQL database
3. Create a `.env` file from the `.env.example` file and update the values
4. Run the application

```bash
# Install dependencies
go mod tidy

# Start the application
go run main.go
```

## Environment Variables

The application requires the following environment variables to be set in the `.env` file:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=contestify

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# GitHub Configuration
GITHUB_TOKEN=your_github_token
```

## Database Tables

The application creates the following tables:

- users
- contests
- test_cases
- submissions
- test_case_results
- solutions

## API Routes

The application exposes the following API routes:

### Public Routes

- `POST /api/v1/auth/signIn` - Sign in with GitHub
- `GET /api/v1/contest` - Get all contests
- `GET /api/v1/leaderboard` - Get the global leaderboard
- `POST /api/v1/auth/refresh` - Refresh access token

### Protected Routes

- `POST /api/v1/codeSubmit/:contestId` - Submit code to a contest
- `GET /api/v1/submissions/:contestId` - Get all submissions for a contest
- `GET /api/v1/submissions/:contestId/:ownerId` - Get submissions for a user in a contest
- `GET /api/v1/submission/:id` - Get a submission by ID
- `POST /api/v1/contest` - Create a contest
- `GET /api/v1/contest/:id` - Get a contest by ID
- `PUT /api/v1/contest/:id` - Update a contest
- `DELETE /api/v1/contest/:id` - Delete a contest
- `POST /api/v1/contest/:id/TestCases` - Add a test case to a contest
- `PUT /api/v1/contest/:id/TestCases` - Update a test case
- `DELETE /api/v1/contest/:contestId/TestCases/:testCaseId` - Delete a test case
- `GET /api/v1/users/:userId/contests` - Get contests attended by a user
- `POST /api/v1/contest/github/createRepo` - Create a GitHub repository from a template 