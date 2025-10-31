# DVcheck - Human Resources Management Platform

A beautiful, modern HR management web application built with React, TypeScript, and Vite. Features a Notion-like UI with smooth animations and role-based access control.

## Features

- **Role-based Authentication**: Admin and Member roles with different dashboards
- **User Management**: Admins can create, view, and manage users
- **Modern UI**: Notion-inspired design with smooth animations
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **TypeScript**: Full type safety throughout the application

## Demo Credentials

### Admin Account
- **Email**: admin@dvcheck.com
- **Password**: password

### Member Account
- **Email**: member@dvcheck.com
- **Password**: password

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── pages/          # Page components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## Features Overview

### Admin Dashboard
- View all users in a beautiful table
- Create new users with role assignment
- Search and filter users
- Delete users
- Statistics overview

### Member Dashboard
- Personal profile view
- Quick actions menu
- Recent activity feed
- Account statistics

## Customization

The app uses a custom color palette inspired by Notion:
- Primary colors: Blue tones
- Secondary colors: Gray tones
- Accent colors: Purple and green for different elements

You can customize the colors in `tailwind.config.js` and `src/index.css`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own HR management needs!