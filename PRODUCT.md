# PRODUCT.md

## Product Overview

A simple time tracker and client management application for tracking work hours, managing clients, and generating reports.

## Core Features Breakdown

### 1. Time Entry System

**Purpose**: Record daily work hours with project/client association and descriptions.

**Implementation Steps**:
1. Create time entry data model
   - Date
   - Hours worked (decimal number)
   - Client ID (reference)
   - Project name (text)
   - Description (text)
   - Created/updated timestamps

2. Build time entry form component
   - Date picker (default to today)
   - Hours input (number field with decimal support)
   - Client dropdown (populated from clients list)
   - Project name text input
   - Description textarea
   - Submit and cancel buttons

3. Create time entries list view
   - Display entries in a table/list format
   - Sort by date (newest first)
   - Show client name, project, hours, and description
   - Add edit and delete actions for each entry

4. Implement CRUD operations
   - Create new time entry
   - Read/list all entries with pagination
   - Update existing entry
   - Delete entry with confirmation

### 2. Client Management

**Purpose**: Manage client information and hourly rates.

**Implementation Steps**:
1. Create client data model
   - Client name
   - Hourly rate (currency)
   - Contact information (optional)
   - Active/inactive status
   - Created/updated timestamps

2. Build client form component
   - Client name input
   - Hourly rate input (currency format)
   - Optional fields (email, phone, address)
   - Active status toggle
   - Submit and cancel buttons

3. Create clients list view
   - Display all clients in a table
   - Show name, hourly rate, and status
   - Add edit and delete actions
   - Filter by active/inactive status

4. Implement client CRUD operations
   - Create new client
   - Read/list all clients
   - Update client information
   - Soft delete (mark as inactive) or hard delete

### 3. Reporting System

**Purpose**: Generate various reports for tracking income and work patterns.

**Implementation Steps**:
1. Create report data aggregation logic
   - Calculate total hours by time period
   - Calculate revenue (hours × hourly rate)
   - Group by client, project, or time period

2. Build report filters component
   - Date range picker (from/to)
   - Report type selector (monthly, yearly, per client, total)
   - Client filter (multi-select)
   - Project filter (text input)

3. Implement report views:
   
   **Monthly Report**:
   - Group entries by month
   - Show total hours and revenue per month
   - Break down by client within each month
   
   **Yearly Report**:
   - Group entries by year
   - Show total hours and revenue per year
   - Include month-by-month breakdown
   
   **Per Client Report**:
   - Select specific client
   - Show all time entries for that client
   - Calculate total hours and revenue
   - Group by project if applicable
   
   **Total/Summary Report**:
   - Overall statistics across all time
   - Total hours worked
   - Total revenue
   - Average hours per day/week/month
   - Top clients by hours/revenue

4. Create report export functionality
   - Export to CSV format
   - Export to PDF (optional)
   - Include all filtered data

### 4. Navigation and Layout

**Implementation Steps**:
1. Create main navigation component
   - Time Entries (home/dashboard)
   - Clients
   - Reports
   - Settings (optional)

2. Build responsive layout
   - Header with navigation
   - Main content area
   - Mobile-friendly design

### 5. Data Persistence

**Implementation Steps**:
1. Choose storage solution
   - PostgreSQL (for production and development)

2. Implement data access layer
   - Abstract database operations
   - Handle data validation
   - Implement error handling

### 6. User Interface Enhancements

**Implementation Steps**:
1. Add loading states
   - Skeleton screens
   - Loading spinners

2. Implement error handling
   - Form validation messages
   - API error notifications
   - Success confirmations

3. Add keyboard shortcuts
   - Quick add time entry (Ctrl/Cmd + N)
   - Navigate between sections
   - Save forms (Ctrl/Cmd + S)

## MVP Priority Order

1. **Phase 1 - Core Functionality**
   - Client management (add, edit, list)
   - Time entry form and list
   - Basic data persistence

2. **Phase 2 - Reporting**
   - Monthly report
   - Per client report
   - Basic filtering

3. **Phase 3 - Enhanced Features**
   - Additional report types
   - Export functionality
   - UI improvements
   - Data validation

## Technical Considerations

- Use React Hook Form for form management
- Implement client-side data validation
- Use date-fns for date manipulation
- Consider using ECharts for visual reports
- Implement responsive design from the start
- Add TypeScript interfaces for all data models