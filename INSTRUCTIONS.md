# INSTRUCTIONS.md - Phase 1 Implementation

## Overview

This document provides step-by-step instructions for implementing Phase 1 of the time tracker app, focusing on database models, authentication, and CRUD operations using PostgreSQL with Supabase.

## Prerequisites

1. Create a Supabase account and project at https://supabase.com
2. Get your project URL and anon key from Supabase dashboard
3. Create `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 1: Install Dependencies

```bash
yarn add @supabase/supabase-js @supabase/ssr
```

## Step 2: Database Schema

Initialize Supabase CLI and create migrations:

```bash
# Install Supabase CLI
yarn add -D supabase

# Initialize Supabase in your project
yarn supabase init

# Link to your Supabase project
yarn supabase link --project-ref your-project-ref

# Create migration files
yarn supabase migration new create_user_tables
```

Create the migration file `supabase/migrations/[timestamp]_create_user_tables.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time entries table
CREATE TABLE public.time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  project_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_client_id ON public.time_entries(client_id);
CREATE INDEX idx_time_entries_date ON public.time_entries(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for clients table
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for time_entries table
CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries" ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Run the migration:

```bash
# Push migration to your Supabase project
yarn supabase db push

# Generate TypeScript types from your database schema
yarn supabase gen types typescript --local > src/types/supabase.ts
```

## Step 3: Supabase Client Setup

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

## Step 4: TypeScript Types

The types will be auto-generated from your database schema using:
```bash
yarn supabase gen types typescript --local > src/types/supabase.ts
```

Additionally, create helper types in `src/types/database.ts`:
```typescript
import { Database } from './supabase'

export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type TimeEntry = Database['public']['Tables']['time_entries']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
export type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']

// Extended types with relationships
export interface TimeEntryWithClient extends TimeEntry {
  client?: Client
}
```

## Step 5: Authentication Flow

### Authentication Components Structure:
1. **Login Page** (`/login`) - Email/password login with "Remember me" option
2. **Register Page** (`/register`) - Sign up with email, password, and full name
3. **Protected Routes** - Middleware to redirect unauthenticated users
4. **User Menu** - Display user info and logout option

### Implementation Steps:

1. Create middleware for protected routes in `src/middleware.ts`
2. Create auth context provider for client-side auth state
3. Create login/register pages with forms
4. Implement password reset flow
5. Add session management

## Step 6: CRUD Operations Implementation

### Client CRUD Service (`src/services/clients.ts`):
```typescript
// Get all clients for current user
async function getClients()

// Get single client by ID
async function getClient(id: string)

// Create new client
async function createClient(data: ClientInsert)

// Update client
async function updateClient(id: string, data: ClientUpdate)

// Delete client (soft delete by setting is_active = false)
async function deleteClient(id: string)
```

### Time Entry CRUD Service (`src/services/timeEntries.ts`):
```typescript
// Get time entries with optional filters
async function getTimeEntries(filters?: { 
  startDate?: string, 
  endDate?: string, 
  clientId?: string 
})

// Get single time entry
async function getTimeEntry(id: string)

// Create new time entry
async function createTimeEntry(data: TimeEntryInsert)

// Update time entry
async function updateTimeEntry(id: string, data: TimeEntryUpdate)

// Delete time entry
async function deleteTimeEntry(id: string)
```

## Step 7: API Routes Structure

Create API routes for server-side operations:
```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── register/route.ts
│   └── session/route.ts
├── clients/
│   ├── route.ts (GET all, POST new)
│   └── [id]/route.ts (GET one, PUT update, DELETE)
└── time-entries/
    ├── route.ts (GET all, POST new)
    └── [id]/route.ts (GET one, PUT update, DELETE)
```

## Step 8: Security Considerations

1. **Row Level Security (RLS)**: Already implemented in database schema
2. **Input Validation**: Validate all inputs before database operations
3. **CSRF Protection**: Supabase handles this automatically
4. **Rate Limiting**: Consider implementing for auth endpoints
5. **Secure Headers**: Use Next.js security headers

## Development Workflow

```bash
# Start local Supabase instance
yarn supabase start

# Create new migration
yarn supabase migration new migration_name

# Apply migrations
yarn supabase db push

# Generate types after schema changes
yarn supabase gen types typescript --local > src/types/supabase.ts

# Reset local database
yarn supabase db reset
```

## Next Steps

After completing Phase 1:
1. Test all CRUD operations thoroughly
2. Implement error handling and loading states
3. Add form validation on client side
4. Create reusable UI components
5. Set up data fetching patterns (consider React Query or SWR)

## Testing Checklist

- [ ] User can register with email and password
- [ ] User can login and logout
- [ ] User can only see their own data
- [ ] User can create, read, update, delete clients
- [ ] User can create, read, update, delete time entries
- [ ] Database constraints are working (e.g., can't delete client with time entries)
- [ ] RLS policies prevent unauthorized access
- [ ] Forms have proper validation
- [ ] Error messages are user-friendly