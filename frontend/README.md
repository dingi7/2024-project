# Contestify

Contestify is a modern web application designed to revolutionize coding competitions. Our platform allows organizers to effortlessly create, manage, and automate code contests, providing a seamless environment for testing and verifying competitors' solutions.

## Features

- Create and manage coding contests
- Automated code evaluation
- Real-time leaderboards
- User authentication and profiles
- Support for multiple programming languages
- Responsive design for desktop and mobile

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Backend: Go
- Database: MongoDB
- Styling: Tailwind CSS
- Authentication: NextAuth.js
- Code Editor: Monaco Editor
- Containerization: Docker

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Go (v1.16 or later)
- Docker
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/contestify.git
   cd contestify
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd ../backend
   go mod tidy
   ```

4. Set up environment variables:
   Create a `.env.local` file in the `frontend` directory and add necessary environment variables (refer to `.env.example` if available).

### Running the Application

1. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

2. Start the backend server:
   ```
   cd backend
   go run main.go
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

- `frontend/`: Next.js frontend application
  - `app/`: Next.js 13+ app directory
  - `components/`: Reusable React components
  - `lib/`: Utility functions and helpers
- `backend/`: Go backend application
  - `models/`: Database models
  - `operations/`: Business logic and operations
  - `util/`: Utility functions

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Go](https://golang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Docker](https://www.docker.com/)
