# Muddiest Point - Anonymous Student Feedback System

## Overview

Muddiest Point is a web application that allows students to anonymously submit feedback about concepts they find confusing in their courses. The system enables professors to track confusion patterns and improve their teaching effectiveness. The application prioritizes student privacy with completely anonymous submissions while providing professors with valuable insights through analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built as a Single Page Application (SPA) using React with TypeScript. The application uses Wouter for lightweight client-side routing and TanStack Query for server state management. The UI is built with shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS using a custom design system with CSS variables for theming.

**Key Frontend Decisions:**
- **React with TypeScript**: Provides type safety and modern development experience
- **Wouter over React Router**: Lightweight routing solution suitable for the simple navigation requirements
- **TanStack Query**: Handles server state management, caching, and synchronization
- **shadcn/ui + Radix UI**: Accessible, customizable component library with consistent design patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens for brand consistency

### Backend Architecture
The server follows a REST API architecture using Express.js with TypeScript. The application implements a layered architecture with clear separation between routes, business logic (storage layer), and database access.

**Key Backend Decisions:**
- **Express.js**: Fast and minimal web framework suitable for REST API requirements
- **Layered Architecture**: Separation of concerns with routes, storage interface, and database layers
- **TypeScript**: Type safety across the entire stack for better developer experience
- **REST API Design**: Simple and stateless API following RESTful conventions

### Database Architecture
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema is designed around three core entities: courses, submissions, and magic links for optional submission tracking.

**Key Database Decisions:**
- **PostgreSQL**: Robust relational database suitable for structured data and analytics queries
- **Drizzle ORM**: Type-safe ORM that generates TypeScript types from schema definitions
- **UUID Primary Keys**: Provides better scalability and prevents enumeration attacks
- **Relational Design**: Normalized schema with clear relationships between entities

### Privacy and Security Architecture
The system is designed with privacy-first principles, allowing completely anonymous submissions while providing optional magic link functionality for users who want to track their own submissions.

**Key Privacy Decisions:**
- **Anonymous by Default**: No personal information required for core functionality
- **Optional Magic Links**: Users can optionally generate tracking tokens without revealing identity
- **No Session Management**: Stateless design reduces privacy concerns
- **Minimal Data Collection**: Only collects necessary academic feedback data

### Data Layer Schema
- **Courses**: Store course information (name, code, timestamps)
- **Submissions**: Core feedback data with confusion levels and topics, linked to courses
- **Magic Links**: Optional tracking tokens for users who want submission history
- **Analytics Support**: Schema designed to support confusion pattern analysis and statistics

### Build and Development Architecture
The application uses Vite for fast development and building, with ESBuild for server-side bundling. The monorepo structure keeps client, server, and shared code organized with clear boundaries.

**Key Build Decisions:**
- **Vite**: Fast development server with Hot Module Replacement
- **ESBuild**: Fast server-side bundling for production
- **Monorepo Structure**: Shared types and utilities between client and server
- **TypeScript Path Mapping**: Clean imports with @ aliases for better code organization

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling via `@neondatabase/serverless`

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives for form controls, dialogs, and interactive components
- **Lucide React**: Icon library providing consistent iconography
- **React Hook Form**: Form handling with validation integration
- **Date-fns**: Date manipulation and formatting utilities

### Development and Build Tools
- **Vite**: Build tool and development server with React plugin support
- **Tailwind CSS**: Utility-first CSS framework with PostCSS integration
- **TypeScript**: Type checking and compilation across the stack
- **Drizzle Kit**: Database schema management and migration tooling

### Data Management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL adapter
- **Drizzle Zod**: Integration between Drizzle schema and Zod validation
- **Zod**: Schema validation for API requests and form data
- **TanStack React Query**: Server state management with caching and synchronization

### Authentication and Session Management
- **Connect PG Simple**: PostgreSQL session store (configured but may not be actively used due to stateless design)

### Styling and Theming
- **Class Variance Authority**: Utility for creating component variants with Tailwind
- **Tailwind Merge**: Utility for merging Tailwind classes without conflicts
- **CLSX**: Conditional class name utility

### Development Environment
- **Replit Integration**: Custom plugins for Replit development environment including cartographer for code navigation and error modal overlays