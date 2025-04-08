# FastMot - Motorcycle Rental Platform

A full-stack web application for motorcycle rentals with features for users, sellers, and administrators.

## Features

- User Authentication & Authorization
- Motorcycle Listings & Search
- Booking Management
- Payment Integration with Stripe
- Seller Dashboard
- Admin Panel
- Review System
- Email Notifications

## Tech Stack

### Frontend
- React.js
- Context API for state management
- CSS for styling
- Stripe Elements for payments

### Backend
- Node.js
- Express.js
- MySQL Database
- JWT Authentication
- Stripe API Integration
- Email Service Integration

## Project Structure

```
├── frontend/               # React frontend application
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── context/       # Context providers
│       ├── hooks/         # Custom hooks
│       └── utils/         # Utility functions
│
├── backend/               # Node.js backend application
│   ├── config/           # Configuration files
│   ├── middleware/       # Custom middleware
│   ├── migrations/       # Database migrations
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/fastmot.git
cd fastmot
```

2. Install Backend Dependencies
```bash
cd backend
npm install
```

3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
- Create `.env` file in backend directory
- Add necessary environment variables (database, stripe, email configs)

5. Run Database Migrations
```bash
cd backend
node run-core-migration.js
```

### Running the Application

1. Start Backend Server
```bash
cd backend
npm start
```

2. Start Frontend Development Server
```bash
cd frontend
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
