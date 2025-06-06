# Payment Request System for SMEs in Vietnam

A comprehensive payment request management system designed specifically for Small and Medium Enterprises (SMEs) in Vietnam.

## Features

- **User Management**: Role-based access control with admin, manager, accountant, and user roles
- **Company Management**: Manage company profiles with Vietnamese business-specific fields
- **Payment Request Management**: Create, track, and manage payment requests throughout their lifecycle
- **Dashboard**: Visual overview of payment statistics and recent activities
- **Notifications**: Real-time notifications for payment status changes
- **Vietnamese Payment Integration**: Support for local payment methods (VNPay, MoMo, ZaloPay)
- **Multilingual Support**: English and Vietnamese language options

## Role-Based Access Control

The system implements a comprehensive role-based access control system with the following roles:

### System Roles
- **Administrator**: Full system access with all permissions
- **Manager**: Department management and approval capabilities
- **Accountant**: Financial operations and reporting
- **Employee**: Basic user with limited permissions

### Business Roles
- **Management**
  - **CEO**: High-level dashboards, financial status analysis, and insights into key trends
  - **Director**: Access to financial status analysis and key trends
- **Department Head**: Visibility into departmental budgets, expense tracking, and approval capabilities
- **Accounting Team**
  - **Chief Accountant**: Full access to financial management features
  - **Staff Accountant**: Access to expense categorization and invoice processing

## Tech Stack

- **Frontend**: React, Blueprint.js, TypeScript
- **Backend**: Bun, Elysia.js, TypeScript
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (v5.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/payment-request-system.git
   cd payment-request-system
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # App
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/payment-request-system

   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d

   # Payment Gateways (replace with your actual credentials)
   VNPAY_MERCHANT_ID=your-vnpay-merchant-id
   VNPAY_SECURE_HASH=your-vnpay-secure-hash
   
   MOMO_PARTNER_CODE=your-momo-partner-code
   MOMO_ACCESS_KEY=your-momo-access-key
   MOMO_SECRET_KEY=your-momo-secret-key
   
   ZALOPAY_APP_ID=your-zalopay-app-id
   ZALOPAY_KEY1=your-zalopay-key1
   ZALOPAY_KEY2=your-zalopay-key2
   ```

4. Initialize roles and dummy users (optional):
   ```bash
   bun run init:roles
   ```

   This will create the following dummy users:
   - CEO: ceo@example.com (Password123!)
   - Director: director@example.com (Password123!)
   - Department Head: department_head@example.com (Password123!)
   - Employees: employee1@example.com, employee2@example.com (Password123!)
   - Accounting Team: chief_accountant@example.com, accountant@example.com (Password123!)

5. Create a system administrator account:
   ```bash
   bun run create:admin
   ```

   This will create a system administrator account with the following credentials:
   - Email: admin@system.com
   - Password: Admin123!

   **Important:** Please change the password after first login!

6. Start the development server:
   ```bash
   bun dev
   ```

7. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
src/
├── client/             # Frontend React application
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── layouts/        # Page layouts
│   ├── pages/          # Application pages
│   ├── styles/         # CSS styles
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── index.tsx       # Entry point
│
├── server/             # Backend Elysia.js application
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   └── index.ts        # Server entry point
│
���── shared/             # Shared code between client and server
    ├── types/          # TypeScript interfaces and types
    └── utils/          # Shared utility functions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Blueprint.js](https://blueprintjs.com/) - UI component library
- [Elysia.js](https://elysiajs.com/) - TypeScript framework for Bun
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [React Router](https://reactrouter.com/) - Routing for React applications
