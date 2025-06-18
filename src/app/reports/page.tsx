'use client'

import { useState, useEffect } from 'react'
import { useReports, ReportSummary, ReportFilters } from '@/hooks/useReports'
import { useClients } from '@/hooks/useClients'
import { Notification } from '@/components/Notification'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'

export default function ReportsPage() {
  const { generateReport, loading, error } = useReports()
  const { clients, loadClients } = useClients()
  const [reportData, setReportData] = useState<ReportSummary | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<ReportFilters>({
    clientIds: [],
    year: new Date().getFullYear(),
    month: undefined
  })
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    if (error) {
      setNotification({ type: 'error', message: error })
    }
  }, [error])

  // Auto-generate report when filters change
  useEffect(() => {
    const generateReportAutomatically = async () => {
      const result = await generateReport({
        ...filters,
        clientIds: selectedClients
      })
      
      if (result) {
        setReportData(result)
      }
    }

    // Only generate if clients are loaded
    if (clients.length > 0 || selectedClients.length === 0) {
      generateReportAutomatically()
    }
  }, [filters, selectedClients, generateReport, clients.length])

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: undefined, label: 'All Months' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const selectAllClients = () => {
    setSelectedClients(clients.map(client => client.id))
  }

  const clearAllClients = () => {
    setSelectedClients([])
  }

  return (
    <div className="w-full py-8 px-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">Generate reports for billable hours and earnings</p>
        </header>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold">Report Filters</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="year" required>Year</Label>
                <Select
                  id="year"
                  value={filters.year.toString()}
                  onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                  className="mt-1"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="month">Month</Label>
                <Select
                  id="month"
                  value={filters.month?.toString() || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    month: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="mt-1"
                >
                  {months.map(month => (
                    <option key={month.label} value={month.value || ''}>{month.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Client Filter</Label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={selectAllClients}
                      variant="secondary"
                      size="sm"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      onClick={clearAllClients}
                      variant="secondary"
                      size="sm"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Selection */}
            {clients.length > 0 && (
              <div className="mt-4">
                <Label>Select Clients ({selectedClients.length} selected)</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {clients.map(client => (
                    <label key={client.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleClientToggle(client.id)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-700 truncate">{client.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Loading Indicator */}
        {loading && (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <div className="inline-flex items-center">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600">Generating report...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Summary */}
        {reportData && !loading && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  Summary for {filters.year}
                  {filters.month && ` - ${months.find(m => m.value === filters.month)?.label}`}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reportData.totalHours}</div>
                    <div className="text-sm text-blue-600">Total Hours</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalAmount)}</div>
                    <div className="text-sm text-green-600">Total Amount</div>
                  </div>
                  <div className="text-center p-4 bg-violet-50 rounded-lg">
                    <div className="text-2xl font-bold text-violet-600">{reportData.entriesCount}</div>
                    <div className="text-sm text-violet-600">Time Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            {reportData.monthlyReports.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <h2 className="text-lg font-semibold">Monthly Breakdown</h2>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.monthlyReports
                        .filter(report => report.totalHours > 0)
                        .map(report => (
                          <TableRow key={report.month}>
                            <TableCell>{report.monthName}</TableCell>
                            <TableCell>{report.totalHours}</TableCell>
                            <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                            <TableCell>{report.entriesCount}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Client Breakdown */}
            {reportData.clientReports.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Client Breakdown</h2>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.clientReports.map(report => (
                        <TableRow key={report.clientId}>
                          <TableCell>{report.clientName}</TableCell>
                          <TableCell>{report.totalHours}</TableCell>
                          <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                          <TableCell>{report.entriesCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}