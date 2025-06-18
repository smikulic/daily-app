import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoEmail = 'demo@demo.com'
const demoPassword = 'demo123'

// Sample clients data
const clientsData = [
  {
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    hourly_rate: 85,
    currency: 'USD',
    address: '123 Tech Street, San Francisco, CA 94105'
  },
  {
    name: 'StartupXYZ',
    email: 'hello@startupxyz.com',
    hourly_rate: 95,
    currency: 'USD',
    address: '456 Innovation Ave, Austin, TX 73301'
  },
  {
    name: 'Marketing Plus',
    email: 'info@marketingplus.com',
    hourly_rate: 75,
    currency: 'USD',
    address: '789 Brand Blvd, New York, NY 10001'
  },
  {
    name: 'E-commerce Hub',
    email: 'support@ecommercehub.com',
    hourly_rate: 90,
    currency: 'USD',
    address: '321 Commerce Lane, Seattle, WA 98101'
  }
]

// Sample time entry descriptions
const timeEntryDescriptions = [
  'Frontend development - React components',
  'Backend API development',
  'Database optimization and queries',
  'Bug fixes and testing',
  'Code review and documentation',
  'Client meeting and project planning',
  'UI/UX design implementation',
  'Performance optimization',
  'Security audit and fixes',
  'Feature development - user authentication',
  'Mobile responsive design',
  'Third-party API integration',
  'Unit testing and test coverage',
  'Deploy to production environment',
  'Research and technical analysis',
  'Debugging production issues',
  'Data migration scripts',
  'Setting up CI/CD pipeline',
  'Code refactoring and cleanup',
  'Technical documentation writing',
  'Mentoring junior developers',
  'Architecture planning meeting',
  'Database schema design',
  'API endpoint development',
  'Frontend state management',
  'Cross-browser compatibility testing',
  'SEO optimization implementation',
  'Analytics integration',
  'Error handling improvements',
  'User feedback implementation'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomHours(): number {
  // Generate random hours between 0.5 and 8.5 (in 0.5 increments)
  const increments = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5]
  return getRandomElement(increments)
}

function generateDateRange(): Date[] {
  const dates: Date[] = []
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Previous month dates (15-20 entries)
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate()
  
  for (let i = 0; i < 20; i++) {
    const randomDay = Math.floor(Math.random() * daysInPreviousMonth) + 1
    const date = new Date(previousYear, previousMonth, randomDay)
    dates.push(date)
  }
  
  // Current month dates (15-20 entries)
  const daysInCurrentMonth = Math.min(now.getDate(), 28) // Don't go beyond today
  
  for (let i = 0; i < 20; i++) {
    const randomDay = Math.floor(Math.random() * daysInCurrentMonth) + 1
    const date = new Date(currentYear, currentMonth, randomDay)
    dates.push(date)
  }
  
  return dates.sort((a, b) => b.getTime() - a.getTime()) // Sort descending (newest first)
}

async function createDemoUser() {
  console.log('Creating demo user...')
  
  // Create user via auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true
  })
  
  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('Demo user already exists, continuing...')
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users.find(user => user.email === demoEmail)
      return existingUser?.id
    } else {
      throw authError
    }
  }
  
  console.log('Demo user created successfully')
  return authData.user.id
}

async function createDemoClients(userId: string) {
  console.log('Creating demo clients...')
  
  const clientsWithUserId = clientsData.map(client => ({
    ...client,
    user_id: userId,
    is_active: true
  }))
  
  const { data, error } = await supabase
    .from('clients')
    .insert(clientsWithUserId)
    .select()
  
  if (error) throw error
  
  console.log(`Created ${data.length} demo clients`)
  return data
}

async function createDemoTimeEntries(userId: string, clients: any[]) {
  console.log('Creating demo time entries...')
  
  const dates = generateDateRange()
  const timeEntries = []
  
  // Create 35-40 time entries (3+ pages worth at 10 per page)
  for (let i = 0; i < 40; i++) {
    const randomClient = getRandomElement(clients)
    const randomDate = getRandomElement(dates)
    const randomHours = getRandomHours()
    const randomDescription = getRandomElement(timeEntryDescriptions)
    
    timeEntries.push({
      user_id: userId,
      client_id: randomClient.id,
      date: randomDate.toISOString().split('T')[0],
      hours: randomHours,
      description: randomDescription
    })
  }
  
  // Sort by date descending (newest first)
  timeEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert(timeEntries)
    .select()
  
  if (error) throw error
  
  console.log(`Created ${data.length} demo time entries`)
  return data
}

async function main() {
  try {
    console.log('Starting demo data seeding...')
    
    // Create demo user
    const userId = await createDemoUser()
    
    if (!userId) {
      throw new Error('Failed to create or find demo user')
    }
    
    // Check if clients already exist for this user
    const { data: existingClients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
    
    let clients = existingClients
    
    if (!existingClients || existingClients.length === 0) {
      // Create demo clients
      clients = await createDemoClients(userId)
    } else {
      console.log('Demo clients already exist, using existing ones...')
    }
    
    // Check if time entries already exist
    const { data: existingEntries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
    
    if (!existingEntries || existingEntries.length < 30) {
      // Delete existing entries and create fresh ones
      if (existingEntries && existingEntries.length > 0) {
        await supabase
          .from('time_entries')
          .delete()
          .eq('user_id', userId)
      }
      
      // Create demo time entries
      await createDemoTimeEntries(userId, clients)
    } else {
      console.log('Demo time entries already exist (30+ entries found)')
    }
    
    console.log('Demo data seeding completed successfully!')
    console.log(`You can now login with: ${demoEmail} / ${demoPassword}`)
    
  } catch (error) {
    console.error('Error seeding demo data:', error)
    process.exit(1)
  }
}

main()