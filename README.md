# Money Exchange Desktop Application

## Note: this app is still a work in progress

A desktop application for money exchange companies built with React, Electron, Node.js, Express, and MySQL.

## Project Structure

```
money-exchange-app/
├── client/                 # React frontend with Electron
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── package.json      # Frontend dependencies
├── server/                # Node.js/Express backend
│   ├── src/              # Server source code
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions
│   └── package.json      # Backend dependencies
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- Yarn package manager
- Git

## Setup Instructions

### Database Setup

1. Install MySQL Server
2. Create a new database:
   ```sql
   CREATE DATABASE money_exchange;
   ```

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=money_exchange
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server:
   ```bash
   yarn dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the development server:
   ```bash
   yarn start
   ```

### Building Desktop App

1. Navigate to the client directory
2. Build the React app:
   ```bash
   yarn build
   ```
3. Package the desktop app:
   ```bash
   yarn package
   ```

## Development Workflow

### Running in Development Mode

1. Start the backend server:
   ```bash
   cd server
   yarn dev
   ```
2. In a new terminal, start the frontend:
   ```bash
   cd client
   yarn start
   ```

### Code Structure

- **Frontend (client/)**

  - Uses React with Material-UI for the interface
  - Electron for desktop application packaging
  - React Router for navigation
  - Axios for API communication
  - Tanstack Query for data fetching and caching
  - React hook form for form management
  - Yup for validation

- **Backend (server/)**
  - Express.js server with ES modules
  - Sequelize ORM for database operations
  - JWT for authentication
  - CORS enabled for development

## Features

- User authentication and authorization
- Currency exchange rates management
- Transaction history and tracking
- Customer management system
- Reports generation and export
- Real-time exchange rate updates
- Multi-currency support
- Currencies exchange (Coming soon)
- Earning calculations (Coming soon)

## API Documentation

The API documentation is available at `http://localhost:4000/api-docs` when running in development mode. (Coming soon)

## Development

- Frontend runs on: http://localhost:3000
- Backend API runs on: http://localhost:4000
- API Documentation: http://localhost:4000/api-docs (Coming soon)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License.
