# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.3 application using the App Router architecture with React 19, TypeScript 5, and Tailwind CSS v4.

## Key Commands

```bash
# Development
npm run dev        # Start development server at http://localhost:3000

# Production
npm run build      # Build for production
npm run start      # Start production server

# Code Quality
npm run lint       # Run ESLint to check code quality
```

## Architecture

### Technology Stack
- **Next.js 15.3.3** with App Router
- **React 19.0.0**
- **TypeScript 5** with strict mode
- **Tailwind CSS v4** using new PostCSS plugin approach
- **ESLint** with Next.js recommended configuration

### Project Structure
- `/src/app/` - App Router pages and layouts
- `/public/` - Static assets
- `@/*` - Path alias for `./src/*`

### Styling
- Tailwind CSS v4 with inline theme configuration in `globals.css`
- CSS custom properties for light/dark theme support
- Geist font family from Vercel

## Important Configuration

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`

### Tailwind CSS v4
Uses the new PostCSS plugin configuration. Theme customization is done inline in CSS files, not in a separate config file.

## Development Notes
- This is a fresh Next.js application with minimal setup
- No testing framework currently configured
- No environment variables or API integrations set up yet