import '@testing-library/jest-dom'

// Mock jsPDF and autoTable since they require browser environment
jest.mock('jspdf', () => {
  const mockAutoTable = jest.fn()
  const mockDoc = {
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    getNumberOfPages: jest.fn(() => 1),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    lastAutoTable: {
      finalY: 100
    }
  }
  
  const mockJsPDF = jest.fn(() => mockDoc)
  mockJsPDF.mockAutoTable = mockAutoTable
  
  return {
    __esModule: true,
    default: mockJsPDF
  }
})

jest.mock('jspdf-autotable', () => {
  return {
    __esModule: true,
    default: jest.fn()
  }
})

// Mock browser APIs that might be needed
Object.defineProperty(global, 'Intl', {
  value: {
    NumberFormat: jest.fn(() => ({
      format: jest.fn((value) => `$${value.toFixed(2)}`)
    }))
  }
})

// Extend jest matchers
expect.extend({
  toHaveBeenCalledWithColor(received, colorArray) {
    const pass = received.mock.calls.some(call => 
      Array.isArray(call[0]) && 
      call[0].length === 3 &&
      call[0].every((val, idx) => val === colorArray[idx])
    )
    
    return {
      message: () => `expected mock to have been called with color [${colorArray.join(', ')}]`,
      pass
    }
  }
})