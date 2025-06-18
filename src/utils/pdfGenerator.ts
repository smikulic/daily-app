import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportSummary, ReportFilters } from '@/hooks/useReports'

interface TimeEntryForPDF {
  date: string
  clientName: string
  description: string
  hours: number
  amount: number
  currency: string
}

export function generateReportPDF(
  reportData: ReportSummary,
  filters: ReportFilters & { clientIds: string[] },
  timeEntries: TimeEntryForPDF[]
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryColor = [139, 92, 246] as const // violet-500
  const grayColor = [107, 114, 128] as const // gray-500
  const lightGrayColor = [243, 244, 246] as const // gray-100
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.text('Time Tracking Report', 20, 25)
  
  // Report Period
  doc.setFontSize(12)
  doc.setTextColor(...grayColor)
  const periodText = filters.month 
    ? `${getMonthName(filters.month)} ${filters.year}`
    : `${filters.year}`
  doc.text(`Report Period: ${periodText}`, 20, 35)
  
  // Generated date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Generated: ${currentDate}`, 20, 42)
  
  // Summary Section
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Summary', 20, 60)
  
  // Summary table
  const summaryData = [
    ['Total Hours', reportData.totalHours.toString()],
    ['Total Amount', formatCurrency(reportData.totalAmount)],
    ['Number of Entries', reportData.entriesCount.toString()],
    ['Clients', filters.clientIds.length === 0 ? 'All Clients' : `${filters.clientIds.length} Selected`]
  ]
  
  autoTable(doc, {
    startY: 65,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 60 }
    },
    margin: { left: 20, right: 20 }
  })
  
  // Client Breakdown (if multiple clients)
  if (reportData.clientReports.length > 1) {
    const finalY = (doc as any).lastAutoTable.finalY || 100
    
    doc.setFontSize(16)
    doc.text('Client Breakdown', 20, finalY + 20)
    
    const clientData = reportData.clientReports.map(client => [
      client.clientName,
      client.totalHours.toString(),
      formatCurrency(client.totalAmount),
      client.entriesCount.toString()
    ])
    
    autoTable(doc, {
      startY: finalY + 25,
      head: [['Client', 'Hours', 'Amount', 'Entries']],
      body: clientData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    })
  }
  
  // Monthly Breakdown (if showing full year)
  if (!filters.month && reportData.monthlyReports.length > 0) {
    const activeMonths = reportData.monthlyReports.filter(month => month.totalHours > 0)
    
    if (activeMonths.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 140
      
      doc.setFontSize(16)
      doc.text('Monthly Breakdown', 20, finalY + 20)
      
      const monthlyData = activeMonths.map(month => [
        month.monthName,
        month.totalHours.toString(),
        formatCurrency(month.totalAmount),
        month.entriesCount.toString()
      ])
      
      autoTable(doc, {
        startY: finalY + 25,
        head: [['Month', 'Hours', 'Amount', 'Entries']],
        body: monthlyData,
        theme: 'grid',
        headStyles: { 
          fillColor: primaryColor,
          textColor: 255,
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      })
    }
  }
  
  // Start new page for detailed entries
  doc.addPage()
  
  // Detailed Time Entries
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Detailed Time Entries', 20, 25)
  
  // Sort entries by date (newest first)
  const sortedEntries = timeEntries.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const entriesData = sortedEntries.map(entry => [
    formatDate(entry.date),
    entry.clientName,
    entry.description,
    entry.hours.toString(),
    formatCurrency(entry.amount)
  ])
  
  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Client', 'Description', 'Hours', 'Amount']],
    body: entriesData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 70 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: { fillColor: lightGrayColor },
    didDrawPage: (data) => {
      // Add page numbers
      const pageNumber = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(...grayColor)
      doc.text(
        `Page ${data.pageNumber} of ${pageNumber}`, 
        doc.internal.pageSize.width - 40, 
        doc.internal.pageSize.height - 10
      )
    }
  })
  
  // Save the PDF
  const fileName = `time-report-${filters.year}${filters.month ? `-${filters.month.toString().padStart(2, '0')}` : ''}.pdf`
  doc.save(fileName)
}

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1]
}