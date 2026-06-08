"use client"
import SignatureModal from '@/components/shared/SignatureModal'
import { useState } from 'react'
import { FaDownload, FaFilePdf, FaCog, FaUser, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'

export default function SignatureOverview() {
  const [activeTab, setActiveTab] = useState('sent')

  // Sample signature data
  const signatureData = {
    name: "Rashid Ali",
    signatureImage: "/placeholder.svg?height=80&width=200"
  }

  // Sample activity data
  const activityData = {
    sent: [
      {
        id: '1',
        fileName: 'contract_agreement.pdf',
        creationDate: 'Jun 15, 2025, 14:30:22',
        signedDate: 'Jun 15, 2025, 15:45:10',
        status: 'signed',
        size: '2.4 MB'
      },
      {
        id: '2',
        fileName: 'employment_contract.pdf',
        creationDate: 'Jun 14, 2025, 09:15:33',
        signedDate: null,
        status: 'pending',
        size: '1.8 MB'
      },
      {
        id: '3',
        fileName: 'nda_document.pdf',
        creationDate: 'Jun 13, 2025, 16:20:45',
        signedDate: 'Jun 14, 2025, 10:30:15',
        status: 'signed',
        size: '1.2 MB'
      }
    ],
    inbox: [
      {
        id: '4',
        fileName: 'vendor_agreement.pdf',
        creationDate: 'Jun 12, 2025, 11:30:48',
        signedDate: 'Jun 12, 2025, 12:15:22',
        status: 'signed',
        size: '3.1 MB'
      },
      {
        id: '5',
        fileName: 'service_contract.pdf',
        creationDate: 'Jun 11, 2025, 08:45:12',
        signedDate: null,
        status: 'pending',
        size: '2.7 MB'
      }
    ],
    signed: [
      {
        id: '6',
        fileName: 'card (1).pdf',
        creationDate: 'Jun 12, 2025, 11:30:48',
        signedDate: 'Jun 12, 2025, 11:35:22',
        status: 'signed',
        size: '1.5 MB'
      },
      {
        id: '7',
        fileName: 'invoice_2025_001.pdf',
        creationDate: 'Jun 10, 2025, 13:22:15',
        signedDate: 'Jun 10, 2025, 13:25:40',
        status: 'signed',
        size: '890 KB'
      }
    ]
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      signed: {
        icon: <FaCheckCircle className="text-green-600" size={14} />,
        text: 'Signed',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      },
      pending: {
        icon: <FaClock className="text-yellow-600" size={14} />,
        text: 'Pending',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
      },
      failed: {
        icon: <FaTimesCircle className="text-blue-600" size={14} />,
        text: 'Failed',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </span>
    )
  }

  const handleDownload = (file) => {
    console.log('Downloading file:', file.fileName)
    alert(`Downloading ${file.fileName}`)
  }

  const handleNewSignature = () => {
    console.log('Creating new signature')
    alert('Redirecting to signature creation...')
  }

  const currentData = activityData[activeTab] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <FaFilePdf className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                PDFDEX
              </h1>
              <p className="text-lg font-semibold text-gray-700">Signature</p>
            </div>
          </div>
          <button
            onClick={handleNewSignature}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            New signature
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your signature</h2>
              <SignatureModal />
            </div>
            <div>
              <div className="flex items-center justify-center h-56 max-w-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <img
                  src={signatureData.signatureImage || "/placeholder.svg"}
                  alt="Your signature"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Last Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Last activity</h3>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'sent', label: 'Sent' },
                { key: 'inbox', label: 'Inbox' },
                { key: 'signed', label: 'Signed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creation Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFilePdf className="text-blue-500 mr-3" size={20} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                          <div className="text-sm text-gray-500">{file.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.creationDate}</div>
                      {file.signedDate && (
                        <div className="text-sm text-green-600">Signed on {file.signedDate}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(file.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {file.status === 'signed' ? (
                        <button
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                          <FaDownload className="mr-2" size={12} />
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentData.length === 0 && (
            <div className="p-12 text-center">
              <FaFilePdf className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500">No signature files in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
