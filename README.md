# Nexa Bank - React Frontend

A complete React 18 frontend application for Nexa Bank, featuring secure authentication, account management, and transaction processing.

## 🚀 Features

- **Landing Page**: Animated hero section with Nexa branding
- **Authentication**: Complete auth flow with OTP verification
- **Account Management**: View multiple accounts with real-time balances
- **Transactions**: Transfer, deposit, and withdraw functionality
- **Responsive Design**: Mobile-friendly interface with professional banking aesthetics
- **Security**: Session-based authentication with CORS support

## 🛠 Tech Stack

- **React 18** with TypeScript
- **React Router DOM 6** for navigation
- **Tailwind CSS** with custom design system
- **Shadcn/ui** components
- **Session-based authentication** (JSESSIONID)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Spring Boot backend running on `http://localhost:8080`

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexa-bank-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🔧 Backend Requirements

The frontend expects a Spring Boot backend running on `http://localhost:8080` with the following endpoints:

### Authentication Endpoints
- `POST /register` - User registration
- `POST /login` - User login with MFA
- `POST /auth/verify-otp` - OTP verification
- `POST /auth/request-password-reset` - Password reset request
- `POST /auth/confirm-password-reset` - Password reset confirmation
- `GET /auth/get-otp` - Get OTP (dev mode only)
- `POST /auth/logout` - User logout

### Banking Endpoints
- `GET /accounts` - Get user accounts
- `GET /transactions` - Get transaction history
- `POST /transactions/transfer` - Transfer between accounts
- `POST /transactions/deposit` - Deposit money
- `POST /transactions/withdraw` - Withdraw money

## 🎨 Design System

Nexa Bank features a professional design system with:

- **Colors**: Blue-900 primary, Green-500 success, Red-500 error
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design approach

## 📱 Application Structure

```
src/
├── components/
│   └── Navbar.tsx          # Navigation with conditional rendering
├── pages/
│   ├── Landing.tsx         # Hero/landing page
│   ├── Login.tsx           # User authentication
│   ├── Register.tsx        # User registration
│   ├── ResetPassword.tsx   # Password reset flow
│   ├── Otp.tsx            # OTP verification
│   └── Dashboard.tsx       # Main banking interface
├── hooks/
│   └── use-toast.ts       # Toast notifications
└── lib/
    └── utils.ts           # Utility functions
```

## 🔐 Authentication Flow

1. **Registration**: Create account with username, email, password, fullName
2. **Login**: Authenticate with username/password → OTP required
3. **OTP Verification**: 6-digit code verification for login/password reset
4. **Password Reset**: Email → new password → OTP verification
5. **Session Management**: Automatic redirects based on auth status

## 💰 Banking Features

### Dashboard
- **Account Overview**: View all accounts with balances
- **Transaction History**: Complete transaction log with filtering
- **Quick Actions**: Transfer, deposit, withdraw forms

### Transactions
- **Transfer**: Move money between user's own accounts
- **Deposit**: Add money to any account
- **Withdraw**: Remove money from accounts (with balance checks)

## 🎯 Development Guidelines

### Error Handling
- Network errors: "Contact Nexa support"
- 401 Unauthorized: Redirect to login
- 403 Forbidden: Show balance/permission errors
- 400 Bad Request: Show validation errors

### Success Messages
- Toast notifications for successful operations
- Real-time balance updates
- Smooth transitions and feedback

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 CORS Configuration

The frontend is configured to work with a Spring Boot backend at `http://localhost:8080` with:
- `credentials: 'include'` for all API calls
- Session-based authentication (JSESSIONID)
- Proper error handling for CORS issues

## 📝 Environment Notes

- **Development**: OTP codes are displayed in the UI for testing
- **Production**: OTP codes are only sent via backend (contact support message shown)
- All API calls include credentials for session management

## 🤝 Contributing

1. Follow the existing code structure and naming conventions
2. Use the established design system for new components
3. Add proper error handling and loading states
4. Test authentication flows thoroughly
5. Ensure responsive design across devices

## 📞 Support

For issues or questions about Nexa Bank, contact our support team.

---

**Note**: This frontend application requires the corresponding Spring Boot backend to be running on `http://localhost:8080` with proper CORS configuration for `http://localhost:3000`.