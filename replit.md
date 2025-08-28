# Overview

ProspectBot is an automated lead prospecting system that captures business leads from Google Maps and facilitates WhatsApp outreach campaigns. The application provides a comprehensive dashboard for managing leads, customizing message templates, controlling sending speeds, and tracking campaign metrics. It's designed to help businesses automate their prospecting workflow while maintaining personalized communication with potential clients.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern single-page application using functional components and hooks
- **Vite**: Fast development server and build tool with hot module replacement
- **Wouter**: Lightweight client-side routing for navigation
- **shadcn/ui Components**: Comprehensive UI component library built on Radix UI primitives with Tailwind CSS styling
- **TanStack Query**: Server state management for API data fetching, caching, and synchronization
- **React Hook Form**: Form handling with Zod validation for type-safe data validation

## Backend Architecture
- **Express.js**: REST API server with middleware for request logging and error handling
- **TypeScript**: Type-safe server-side development with ES modules
- **In-Memory Storage**: Development-friendly storage layer with interface for easy database migration
- **Modular Route Structure**: Organized API endpoints for leads, message templates, speed configuration, and dashboard metrics

## Database Design
- **Drizzle ORM**: Type-safe database queries with PostgreSQL dialect
- **Schema Structure**:
  - `leads`: Core prospect data with contact information and status tracking
  - `message_templates`: Customizable WhatsApp message templates with placeholder support
  - `speed_config`: Rate limiting controls for message sending
  - `dashboard_metrics`: Aggregated analytics and performance tracking
- **UUID Primary Keys**: Consistent identifier strategy across all tables
- **Timestamp Tracking**: Automatic date/time recording for audit trails

## State Management
- **Server State**: TanStack Query manages API data with optimistic updates and automatic cache invalidation
- **Form State**: React Hook Form with Zod schemas for validation and type safety
- **UI State**: React hooks (useState, useContext) for component-level state management
- **Toast Notifications**: Centralized user feedback system for actions and errors

## API Design
- **RESTful Endpoints**: Standard HTTP methods with consistent response formats
- **CRUD Operations**: Full data management for all entities (leads, templates, configuration)
- **Bulk Operations**: CSV export functionality for data portability
- **Simulation Endpoints**: WhatsApp message sending simulation for development/testing
- **Error Handling**: Structured error responses with appropriate HTTP status codes

## Styling and UI
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **CSS Variables**: Theme-aware color system supporting light/dark modes
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Component Variants**: Class Variance Authority for consistent component styling patterns

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with concurrent features
- **Express**: Node.js web framework for API development
- **TypeScript**: Static type checking for both client and server

## Database and ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL database provider (configured but not implemented)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Headless component primitives for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library with consistent design
- **React Icons**: Additional icon sets (Font Awesome for WhatsApp)

## Data Management
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form handling with performance optimization
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite**: Build tool with development server and HMR
- **tsx**: TypeScript execution for development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development environment integration for runtime error handling

## Google Maps Integration
- **Google Maps API**: Lead data extraction from business listings (simulated in current implementation)
- **Location-based Search**: Business discovery by type and geographic area

## WhatsApp Integration
- **WhatsApp Business API**: Message sending capabilities (simulated in current implementation)
- **Template Messaging**: Structured message formats with dynamic content placeholders