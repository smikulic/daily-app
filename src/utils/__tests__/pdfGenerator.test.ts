import { generateReportPDF } from '../pdfGenerator'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportSummary, ReportFilters } from '@/hooks/useReports'

// Mock data for testing
const mockReportData: ReportSummary = {
  totalHours: 40,
  totalAmount: 3400,
  entriesCount: 8,
  monthlyReports: [
    {
      month: 1,
      monthName: 'January',
      totalHours: 20,
      totalAmount: 1700,
      entriesCount: 4
    },
    {
      month: 2,
      monthName: 'February',
      totalHours: 20,
      totalAmount: 1700,
      entriesCount: 4
    }
  ],
  clientReports: [
    {
      clientId: '1',
      clientName: 'TechCorp Solutions',
      totalHours: 25,
      totalAmount: 2125,
      entriesCount: 5
    },
    {
      clientId: '2',
      clientName: 'StartupXYZ',
      totalHours: 15,
      totalAmount: 1275,
      entriesCount: 3
    }
  ]
}

const mockFilters: ReportFilters & { clientIds: string[] } = {
  year: 2024,
  month: undefined,
  clientIds: ['1', '2']
}

const mockTimeEntries = [
  {
    date: '2024-01-15',
    clientName: 'TechCorp Solutions',
    description: 'Frontend development',
    hours: 8,
    amount: 680,
    currency: 'USD'
  },
  {
    date: '2024-01-16',
    clientName: 'StartupXYZ',
    description: 'Backend API development',
    hours: 6,
    amount: 510,
    currency: 'USD'
  },
  {
    date: '2024-02-01',
    clientName: 'TechCorp Solutions',
    description: 'Database optimization',
    hours: 4,
    amount: 340,
    currency: 'USD'
  }
]

describe('pdfGenerator', () => {
  let mockDoc: any
  let mockJsPDF: jest.MockedClass<typeof jsPDF>
  let mockAutoTable: jest.MockedFunction<typeof autoTable>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Get the mocked constructors
    mockJsPDF = jsPDF as jest.MockedClass<typeof jsPDF>
    mockAutoTable = autoTable as jest.MockedFunction<typeof autoTable>
  })

  describe('generateReportPDF', () => {
    it('should create a new jsPDF instance', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      expect(mockJsPDF).toHaveBeenCalledTimes(1)
    })

    it('should set up the header with correct styling', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      // Get the mock document instance that was created
      mockDoc = mockJsPDF.mock.results[0].value
      
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(24)
      expect(mockDoc.setTextColor).toHaveBeenCalledWith(139, 92, 246)
      expect(mockDoc.text).toHaveBeenCalledWith('Time Tracking Report', 20, 25)
    })

    it('should display the correct report period for yearly report', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.text).toHaveBeenCalledWith('Report Period: 2024', 20, 35)
    })

    it('should display the correct report period for monthly report', () => {
      const monthlyFilters = { ...mockFilters, month: 6 }
      generateReportPDF(mockReportData, monthlyFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.text).toHaveBeenCalledWith('Report Period: June 2024', 20, 35)
    })

    it('should generate summary table with autoTable', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockAutoTable).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          startY: 65,
          head: [['Metric', 'Value']],
          body: [
            ['Total Hours', '40'],
            ['Total Amount', '$3400.00'],
            ['Number of Entries', '8'],
            ['Clients', '2 Selected']
          ],
          theme: 'grid'
        })
      )
    })

    it('should generate client breakdown when multiple clients exist', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      // Should call autoTable at least twice (summary + client breakdown)
      expect(mockAutoTable).toHaveBeenCalledTimes(4) // summary + client + monthly + detailed entries
    })

    it('should not generate client breakdown when only one client', () => {
      const singleClientData = {
        ...mockReportData,
        clientReports: [mockReportData.clientReports[0]]
      }
      
      generateReportPDF(singleClientData, mockFilters, mockTimeEntries)
      
      // Should call autoTable 3 times (summary + monthly + detailed entries, no client breakdown)
      expect(mockAutoTable).toHaveBeenCalledTimes(3)
    })

    it('should generate monthly breakdown for yearly reports', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      // Check that monthly breakdown table is created
      expect(mockAutoTable).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          head: [['Month', 'Hours', 'Amount', 'Entries']],
          body: [
            ['January', '20', '$1700.00', '4'],
            ['February', '20', '$1700.00', '4']
          ]
        })
      )
    })

    it('should not generate monthly breakdown for monthly reports', () => {
      const monthlyFilters = { ...mockFilters, month: 6 }
      generateReportPDF(mockReportData, monthlyFilters, mockTimeEntries)
      
      // Should call autoTable 3 times (summary + client breakdown + detailed entries, no monthly breakdown)
      expect(mockAutoTable).toHaveBeenCalledTimes(3)
    })

    it('should add a new page for detailed entries', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.addPage).toHaveBeenCalledTimes(1)
    })

    it('should generate detailed time entries table', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockAutoTable).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          startY: 35,
          head: [['Date', 'Client', 'Description', 'Hours', 'Amount']],
          body: [
            ['Feb 1, 2024', 'TechCorp Solutions', 'Database optimization', '4', '$340.00'],
            ['Jan 16, 2024', 'StartupXYZ', 'Backend API development', '6', '$510.00'],
            ['Jan 15, 2024', 'TechCorp Solutions', 'Frontend development', '8', '$680.00']
          ]
        })
      )
    })

    it('should save the PDF with correct filename for yearly report', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.save).toHaveBeenCalledWith('time-report-2024.pdf')
    })

    it('should save the PDF with correct filename for monthly report', () => {
      const monthlyFilters = { ...mockFilters, month: 6 }
      generateReportPDF(mockReportData, monthlyFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.save).toHaveBeenCalledWith('time-report-2024-06.pdf')
    })

    it('should handle empty time entries gracefully', () => {
      expect(() => {
        generateReportPDF(mockReportData, mockFilters, [])
      }).not.toThrow()
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should handle report with no client filters', () => {
      const allClientsFilters = { ...mockFilters, clientIds: [] }
      generateReportPDF(mockReportData, allClientsFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockAutoTable).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          body: expect.arrayContaining([
            ['Clients', 'All Clients']
          ])
        })
      )
    })

    it('should sort time entries by date descending', () => {
      const unsortedEntries = [
        mockTimeEntries[0], // 2024-01-15
        mockTimeEntries[2], // 2024-02-01
        mockTimeEntries[1]  // 2024-01-16
      ]
      
      generateReportPDF(mockReportData, mockFilters, unsortedEntries)
      
      // The last autoTable call should be for detailed entries
      const detailedEntriesCall = mockAutoTable.mock.calls[mockAutoTable.mock.calls.length - 1]
      const tableBody = detailedEntriesCall[1].body
      
      // Should be sorted by date descending (Feb 1, Jan 16, Jan 15)
      expect(tableBody[0][0]).toBe('Feb 1, 2024')
      expect(tableBody[1][0]).toBe('Jan 16, 2024')
      expect(tableBody[2][0]).toBe('Jan 15, 2024')
    })

    it('should use correct colors throughout the document', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      // Check that violet color (139, 92, 246) is used for headers
      expect(mockDoc.setTextColor).toHaveBeenCalledWith(139, 92, 246)
      
      // Check that gray color (107, 114, 128) is used for secondary text
      expect(mockDoc.setTextColor).toHaveBeenCalledWith(107, 114, 128)
    })
  })

  describe('helper functions', () => {
    it('should format currency correctly', () => {
      // This is tested indirectly through the table data
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      const summaryCall = mockAutoTable.mock.calls[0]
      const summaryBody = summaryCall[1].body
      
      expect(summaryBody[1][1]).toBe('$3400.00') // Total Amount formatted
    })

    it('should format dates correctly', () => {
      generateReportPDF(mockReportData, mockFilters, mockTimeEntries)
      
      const detailedEntriesCall = mockAutoTable.mock.calls[mockAutoTable.mock.calls.length - 1]
      const tableBody = detailedEntriesCall[1].body
      
      expect(tableBody[0][0]).toBe('Feb 1, 2024')
      expect(tableBody[1][0]).toBe('Jan 16, 2024')
      expect(tableBody[2][0]).toBe('Jan 15, 2024')
    })

    it('should get month names correctly', () => {
      const monthlyFilters = { ...mockFilters, month: 12 }
      generateReportPDF(mockReportData, monthlyFilters, mockTimeEntries)
      
      mockDoc = mockJsPDF.mock.results[0].value
      expect(mockDoc.text).toHaveBeenCalledWith('Report Period: December 2024', 20, 35)
    })
  })

  describe('edge cases', () => {
    it('should handle zero amounts', () => {
      const zeroAmountEntries = [
        {
          ...mockTimeEntries[0],
          amount: 0
        }
      ]
      
      expect(() => {
        generateReportPDF(mockReportData, mockFilters, zeroAmountEntries)
      }).not.toThrow()
    })

    it('should handle missing client names', () => {
      const missingClientEntries = [
        {
          ...mockTimeEntries[0],
          clientName: ''
        }
      ]
      
      expect(() => {
        generateReportPDF(mockReportData, mockFilters, missingClientEntries)
      }).not.toThrow()
    })

    it('should handle very long descriptions', () => {
      const longDescriptionEntries = [
        {
          ...mockTimeEntries[0],
          description: 'A'.repeat(200)
        }
      ]
      
      expect(() => {
        generateReportPDF(mockReportData, mockFilters, longDescriptionEntries)
      }).not.toThrow()
    })
  })
})

// Type augmentation for custom jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithColor(colorArray: number[]): R
    }
  }
}