"use client"

import { useEffect, useRef, useState } from "react"
import { useSignature } from "@/context/Signature.context"
import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaFilePdf,
  FaClock,
  FaEye,
  FaRedo,
  FaTimesCircle,
} from "react-icons/fa"

function classNames(...c) {
  return c.filter(Boolean).join(" ")
}

function formatDate(dt) {
  try {
    const d = new Date(dt)
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return dt
  }
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.()
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [ref, onClose])
}

function RowActions({ row }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const {
    downloadOriginalDocument,
    deleteSignatureRequest,
    getSignatureDetails
  } = useSignature()

  useOutsideClose(ref, () => setOpen(false))

  const handleViewDetails = async () => {
    try {
      const details = await getSignatureDetails(row._id)
      if (details) {
        alert(`Viewing details for ${row.document?.originalName || row.fileName}`)
      }
    } catch (error) {
      alert('Failed to fetch signature details')
    }
    setOpen(false)
  }

  const handleDownloadOriginal = () => {
    downloadOriginalDocument(row._id, row.document?.originalName || row.fileName)
    setOpen(false)
  }

  const handleResend = () => {
    // This would typically make an API call to resend the signature request
    alert(`Resending signature request for ${row.document?.originalName || row.fileName}`)
    setOpen(false)
  }

  const handleCancel = () => {
    if (confirm(`Are you sure you want to cancel the signature request for ${row.document?.originalName || row.fileName}?`)) {
      deleteSignatureRequest(row._id)
    }
    setOpen(false)
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={handleViewDetails}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-l-md text-sm bg-white text-gray-700 hover:bg-gray-50"
      >
        <FaEye className="text-gray-600" />
        View
      </button>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="px-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50"
        title="More actions"
      >
        <FaChevronDown />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-50 w-64 rounded-md border border-gray-200 bg-white shadow-lg flex flex-col"
          style={{
            top: '100%',
            right: 0,
            marginTop: '8px'
          }}
        >
          <button
            role="menuitem"
            onClick={handleViewDetails}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
          >
            View details
          </button>
          <button
            role="menuitem"
            onClick={handleDownloadOriginal}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
          >
            Download original
          </button>
          <button
            role="menuitem"
            onClick={handleResend}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600"
          >
            Resend request
          </button>
          <button
            role="menuitem"
            onClick={handleCancel}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-medium"
          >
            Cancel request
          </button>
        </div>
      )}
    </div>
  )
}

function StatusIndicator({ signers, totalSigners }) {
  const signedCount = signers.filter(signer => signer.status === 'signed').length
  const pendingCount = signers.filter(signer => signer.status === 'pending').length

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-sm">
        <div className="flex items-center text-yellow-600">
          <FaClock className="mr-1" size={12} />
          <span className="font-medium">Pending</span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {signedCount}/{totalSigners} signed
      </div>
    </div>
  )
}

function SignersList({ signers }) {
  const [showAll, setShowAll] = useState(false)
  const displaySigners = showAll ? signers : signers.slice(0, 2)

  return (
    <div className="space-y-1">
      {displaySigners.map((signer, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className={classNames(
            "w-2 h-2 rounded-full",
            signer.status === 'signed' ? 'bg-green-500' :
              signer.status === 'viewed' ? 'bg-blue-500' :
                'bg-yellow-500'
          )} />
          <span className="text-gray-700">{signer.name}</span>
          <span className="text-xs text-gray-500">({signer.email})</span>
        </div>
      ))}
      {signers.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showAll ? 'Show less' : `+${signers.length - 2} more`}
        </button>
      )}
    </div>
  )
}

export default function PendingSignaturesPage() {
  const {
    signatures,
    pagination,
    loading,
    error,
    filters,
    fetchSignaturesByStatus,
    applyFilters,
    clearFilters,
    handlePageChange,
    currentPage,
    clearError
  } = useSignature()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tmpSearch, setTmpSearch] = useState("")
  const [tmpStart, setTmpStart] = useState("2020-01-01")
  const [tmpEnd, setTmpEnd] = useState(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  })

  // Load pending signatures on component mount
  useEffect(() => {
    fetchSignaturesByStatus('pending', 1, 10)
  }, [])

  const handleApplyFilters = () => {
    applyFilters({
      search: tmpSearch.trim(),
      startDate: tmpStart,
      endDate: tmpEnd,
      status: ['pending'], // Always filter by pending status
    })
    setFiltersOpen(false)
  }

  const handleClearFilters = () => {
    setTmpSearch("")
    setTmpStart("2020-01-01")
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const today = `${yyyy}-${mm}-${dd}`
    setTmpEnd(today)

    // Re-fetch pending with cleared filters
    fetchSignaturesByStatus('pending', 1, 10)
    setFiltersOpen(false)
  }

  const onSearchSubmit = (e) => {
    e.preventDefault()
    handleApplyFilters()
  }

  const toggleSort = () => {
    applyFilters({
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      status: ['pending']
    })
  }

  // Calculate display numbers
  const total = pagination.totalItems
  const from = total > 0 ? ((currentPage - 1) * pagination.itemsPerPage) + 1 : 0
  const to = Math.min(currentPage * pagination.itemsPerPage, total)

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
              <h1 className="text-2xl font-bold text-gray-900">PDFDEX</h1>
              <p className="text-lg font-semibold text-gray-700">Signature</p>
            </div>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            onClick={() => alert("New signature flow")}
          >
            New signature
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-blue-500 hover:text-blue-700">
              <FaTimesCircle />
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Pending signatures</h2>
            <p className="text-sm text-gray-600 mt-1">Documents waiting for signatures</p>
          </div>

          {/* Toolbar */}
          <div className="px-6 pb-4 mt-4">
            <form onSubmit={onSearchSubmit} className="flex items-stretch gap-0">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-l-md hover:bg-gray-50"
              >
                <FaFilter />
                <span className="font-medium">Filters</span>
                {filtersOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <input
                value={tmpSearch}
                onChange={(e) => setTmpSearch(e.target.value)}
                placeholder="Search pending signatures..."
                className="flex-1 border border-l-0 border-gray-300 px-4 bg-white outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                aria-label="Search"
                disabled={loading}
                className="px-4 py-2 border border-gray-300 border-l-0 bg-gray-700 text-white rounded-r-md hover:bg-gray-800 disabled:opacity-50"
              >
                <FaSearch />
              </button>
            </form>

            {/* Filters panel */}
            {filtersOpen && (
              <div className="mt-4 border border-gray-300 rounded-lg bg-gray-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date range */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Creation Date</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={tmpStart}
                        onChange={(e) => setTmpStart(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="date"
                        value={tmpEnd}
                        onChange={(e) => setTmpEnd(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-6">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-6 py-8 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                Loading pending signatures...
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && (
            <>
              <div className="px-6 pb-2 text-sm text-gray-600">{from}-{to} of {total}</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Document
                      </th>
                      <th
                        onClick={toggleSort}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
                      >
                        <div className="inline-flex items-center gap-1">
                          Sent Date
                          {filters.sortOrder === "desc" ? (
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5 5 5-5H5z" /></svg>
                          ) : (
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 12l5-5 5 5H5z" /></svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {signatures.map((row) => {
                      const fileName = row.document?.originalName || "Unknown File"
                      const totalSigners = row.signers?.length || 0

                      return (
                        <tr key={row._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <FaFilePdf className="text-blue-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{fileName}</div>
                                <div className="text-xs text-gray-500">{row.document?.size || "Unknown size"}</div>
                                <div className="text-xs text-gray-500">ID: {row.trackingId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(row.createdAt)}</div>
                            {row.documentSettings?.expirationDate && (
                              <div className="text-xs text-orange-600">
                                Expires: {new Date(row.documentSettings.expirationDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <SignersList signers={row.signers || []} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusIndicator signers={row.signers || []} totalSigners={totalSigners} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RowActions row={row} />
                          </td>
                        </tr>
                      )
                    })}
                    {signatures.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          <FaClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending signatures</h3>
                          <p className="text-gray-500">All your signature requests have been completed or there are no pending requests.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 pt-2 pb-6 text-sm text-gray-600">{from}-{to} of {total}</div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i
                      if (pageNum > pagination.totalPages) return null

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={classNames(
                            "px-3 py-1 text-sm border rounded-md disabled:cursor-not-allowed",
                            pageNum === currentPage
                              ? "bg-blue-500 text-white border-blue-500"
                              : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          )}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useEffect, useMemo, useRef, useState } from "react"
// import {
//   FaSearch,
//   FaFilter,
//   FaChevronDown,
//   FaChevronUp,
//   FaDownload,
//   FaFilePdf,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaClock,
// } from "react-icons/fa"

// function classNames(...c) {
//   return c.filter(Boolean).join(" ")
// }

// // Sample data: only pending requests
// const pendingRequests = [
//   {
//     id: "p-101",
//     fileName: "employment_offer.pdf",
//     recipientName: "Ahsan Iqbal",
//     createdAt: "2025-07-08T10:15:00Z",
//     signedAt: null,
//     status: "pending",
//     size: "1.9 MB",
//   },
//   {
//     id: "p-102",
//     fileName: "nda_client_xyz.pdf",
//     recipientName: "Hira Khan",
//     createdAt: "2025-07-05T14:32:20Z",
//     signedAt: null,
//     status: "pending",
//     size: "1.2 MB",
//   },
//   {
//     id: "p-103",
//     fileName: "partnership_agreement.pdf",
//     recipientName: "Bilal Ahmed",
//     createdAt: "2025-07-01T08:05:48Z",
//     signedAt: null,
//     status: "pending",
//     size: "2.6 MB",
//   },
//   {
//     id: "p-104",
//     fileName: "onboarding_forms.pdf",
//     recipientName: "Zainab Tariq",
//     createdAt: "2025-06-28T12:40:10Z",
//     signedAt: null,
//     status: "pending",
//     size: "3.1 MB",
//   },
// ]

// const allStatusOptions = [
//   { key: "signed", label: "Signed" },
//   { key: "pending", label: "Pending" },
//   { key: "expiring", label: "Expiring" },
//   { key: "voided", label: "Voided" },
//   { key: "declined", label: "Declined" },
//   { key: "expired", label: "Expired" },
//   { key: "action_required", label: "Action required" },
//   { key: "deleted", label: "Deleted" },
// ]

// function formatDate(dt) {
//   try {
//     const d = new Date(dt)
//     return d.toLocaleString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: false,
//     })
//   } catch {
//     return dt
//   }
// }

// function StatusBadge({ status }) {
//   const map = {
//     signed: {
//       text: "Signed",
//       class: "text-green-700 border-green-300 bg-green-50",
//       icon: <FaCheckCircle className="mr-1" />,
//     },
//     pending: {
//       text: "Pending",
//       class: "text-yellow-700 border-yellow-300 bg-yellow-50",
//       icon: <FaClock className="mr-1" />,
//     },
//     declined: {
//       text: "Declined",
//       class: "text-blue-700 border-blue-300 bg-blue-50",
//       icon: <FaTimesCircle className="mr-1" />,
//     },
//     expired: { text: "Expired", class: "text-gray-700 border-gray-300 bg-gray-50", icon: null },
//     expiring: { text: "Expiring", class: "text-orange-700 border-orange-300 bg-orange-50", icon: null },
//     voided: { text: "Voided", class: "text-purple-700 border-purple-300 bg-purple-50", icon: null },
//     action_required: { text: "Action required", class: "text-blue-700 border-blue-300 bg-blue-50", icon: null },
//     deleted: { text: "Deleted", class: "text-gray-700 border-gray-300 bg-gray-50", icon: null },
//   }
//   const cfg = map[status] || { text: status, class: "text-gray-700 border-gray-300 bg-gray-50" }
//   return (
//     <span className={classNames("inline-flex items-center px-3 py-1 rounded-full text-sm border", cfg.class)}>
//       {cfg.icon}
//       {cfg.text}
//     </span>
//   )
// }

// function useOutsideClose(ref, onClose) {
//   useEffect(() => {
//     function handler(e) {
//       if (ref.current && !ref.current.contains(e.target)) onClose?.()
//     }
//     document.addEventListener("mousedown", handler)
//     document.addEventListener("touchstart", handler)
//     return () => {
//       document.removeEventListener("mousedown", handler)
//       document.removeEventListener("touchstart", handler)
//     }
//   }, [ref, onClose])
// }

// function RowActions({ row, disabled = false, onDownload, onView, onAudit, onOriginal, onDelete }) {
//   const [open, setOpen] = useState(false)
//   const ref = useRef(null)
//   useOutsideClose(ref, () => setOpen(false))

//   return (
//     <div className="relative inline-flex" ref={ref}>
//       <button
//         disabled={disabled}
//         onClick={() => !disabled && onDownload?.(row)}
//         className={classNames(
//           "inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-l-md text-sm",
//           disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50",
//         )}
//       >
//         <FaDownload className="text-gray-600" />
//         Download
//       </button>
//       <button
//         aria-haspopup="menu"
//         aria-expanded={open}
//         onClick={() => setOpen((o) => !o)}
//         className="px-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50"
//         title="More actions"
//       >
//         <FaChevronDown />
//       </button>

//       {open && (
//         <div
//           role="menu"
//           className="absolute right-0 top-full mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden z-10"
//         >
//           <button
//             role="menuitem"
//             onClick={() => {
//               setOpen(false)
//               onView?.(row)
//             }}
//             className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
//           >
//             View details
//           </button>
//           <button
//             role="menuitem"
//             onClick={() => {
//               setOpen(false)
//               onDownload?.(row)
//             }}
//             className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
//           >
//             Download signed documents
//           </button>
//           <button
//             role="menuitem"
//             onClick={() => {
//               setOpen(false)
//               onAudit?.(row)
//             }}
//             className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
//           >
//             Download Audit
//           </button>
//           <button
//             role="menuitem"
//             onClick={() => {
//               setOpen(false)
//               onOriginal?.(row)
//             }}
//             className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
//           >
//             Download Original
//           </button>
//           <div className="border-t border-gray-200" />
//           <button
//             role="menuitem"
//             onClick={() => {
//               setOpen(false)
//               onDelete?.(row)
//             }}
//             className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-medium"
//           >
//             Delete
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// export default function PendingSignaturesPage() {
//   // toolbar states
//   const [filtersOpen, setFiltersOpen] = useState(false)
//   const [sortDir, setSortDir] = useState("desc")

//   // Temporary (editable) filter form state
//   const [tmpSearch, setTmpSearch] = useState("")
//   const [tmpStart, setTmpStart] = useState("2020-01-01")
//   const [tmpEnd, setTmpEnd] = useState(() => {
//     const now = new Date()
//     const yyyy = now.getFullYear()
//     const mm = String(now.getMonth() + 1).padStart(2, "0")
//     const dd = String(now.getDate()).padStart(2, "0")
//     return `${yyyy}-${mm}-${dd}`
//   })
//   const [tmpStatuses, setTmpStatuses] = useState({ pending: true }) // default: Pending selected

//   // Applied filters
//   const [search, setSearch] = useState("")
//   const [startDate, setStartDate] = useState("2020-01-01")
//   const [endDate, setEndDate] = useState(tmpEnd)
//   const [statuses, setStatuses] = useState({ pending: true })

//   const applyFilters = () => {
//     setSearch(tmpSearch.trim())
//     setStartDate(tmpStart)
//     setEndDate(tmpEnd)
//     setStatuses(tmpStatuses)
//     setFiltersOpen(false)
//   }

//   const clearFilters = () => {
//     setTmpSearch("")
//     setTmpStart("2020-01-01")
//     const now = new Date()
//     const yyyy = now.getFullYear()
//     const mm = String(now.getMonth() + 1).padStart(2, "0")
//     const dd = String(now.getDate()).padStart(2, "0")
//     const today = `${yyyy}-${mm}-${dd}`
//     setTmpEnd(today)
//     setTmpStatuses({ pending: true })
//     setSearch("")
//     setStartDate("2020-01-01")
//     setEndDate(today)
//     setStatuses({ pending: true })
//   }

//   const filtered = useMemo(() => {
//     const start = new Date(startDate).getTime()
//     const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
//     const statusKeys = Object.keys(statuses).filter((k) => statuses[k])

//     return pendingRequests
//       .filter((r) => {
//         // Date range
//         const created = new Date(r.createdAt).getTime()
//         if (isFinite(start) && created < start) return false
//         if (isFinite(end) && created > end) return false
//         // Statuses (if any selected)
//         if (statusKeys.length > 0 && !statusKeys.includes(r.status)) return false
//         // Search by file name or recipient
//         if (search) {
//           const q = search.toLowerCase()
//           const hit = r.fileName.toLowerCase().includes(q) || (r.recipientName || "").toLowerCase().includes(q)
//           if (!hit) return false
//         }
//         return true
//       })
//       .sort((a, b) => {
//         const da = new Date(a.createdAt).getTime()
//         const db = new Date(b.createdAt).getTime()
//         return sortDir === "asc" ? da - db : db - da
//       })
//   }, [search, startDate, endDate, statuses, sortDir])

//   const total = filtered.length
//   const from = total > 0 ? 1 : 0
//   const to = total

//   const onSearchSubmit = (e) => {
//     e.preventDefault()
//     applyFilters()
//   }

//   const toggleStatus = (key) => {
//     setTmpStatuses((s) => ({ ...s, [key]: !s[key] }))
//   }

//   const toggleSort = () => {
//     setSortDir((d) => (d === "asc" ? "desc" : "asc"))
//   }

//   const handleDownload = (row) => alert(`Downloading signed docs for ${row.fileName} (if available)`)
//   const handleView = (row) => alert(`Viewing details for ${row.fileName}`)
//   const handleAudit = (row) => alert(`Downloading Audit for ${row.fileName}`)
//   const handleOriginal = (row) => alert(`Downloading Original for ${row.fileName}`)
//   const handleDelete = (row) => alert(`Deleting ${row.fileName}`)

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center space-x-3">
//             <div className="bg-blue-600 rounded-lg p-2">
//               <FaFilePdf className="text-white" size={24} />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">PDFDEX</h1>
//               <p className="text-lg font-semibold text-gray-700">Signature</p>
//             </div>
//           </div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//             onClick={() => alert("New signature flow")}
//           >
//             New signature
//           </button>
//         </div>

//         {/* Card */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="px-6 pt-6">
//             <h2 className="text-xl font-semibold text-gray-900">Pending requests</h2>
//           </div>

//           {/* Toolbar */}
//           <div className="px-6 pb-4 mt-4">
//             <form onSubmit={onSearchSubmit} className="flex items-stretch gap-0">
//               <button
//                 type="button"
//                 onClick={() => setFiltersOpen((o) => !o)}
//                 className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-l-md hover:bg-gray-50"
//               >
//                 <FaFilter />
//                 <span className="font-medium">Filters</span>
//                 {filtersOpen ? <FaChevronUp /> : <FaChevronDown />}
//               </button>
//               <input
//                 value={tmpSearch}
//                 onChange={(e) => setTmpSearch(e.target.value)}
//                 placeholder="Search here..."
//                 className="flex-1 border border-l-0 border-gray-300 px-4 bg-white outline-none placeholder:text-gray-400"
//               />
//               <button
//                 type="submit"
//                 aria-label="Search"
//                 className="px-4 py-2 border border-gray-300 border-l-0 bg-gray-700 text-white rounded-r-md hover:bg-gray-800"
//               >
//                 <FaSearch />
//               </button>
//             </form>

//             {/* Filters panel */}
//             {filtersOpen && (
//               <div className="mt-4 border border-gray-300 rounded-lg bg-gray-50 p-6">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   {/* Date range */}
//                   <div className="md:col-span-1">
//                     <h4 className="text-sm font-semibold text-gray-800 mb-3">Creation Date</h4>
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="date"
//                         value={tmpStart}
//                         onChange={(e) => setTmpStart(e.target.value)}
//                         className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                       />
//                       <span className="text-gray-500">-</span>
//                       <input
//                         type="date"
//                         value={tmpEnd}
//                         onChange={(e) => setTmpEnd(e.target.value)}
//                         className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                       />
//                     </div>
//                   </div>

//                   {/* Statuses */}
//                   <div className="md:col-span-2">
//                     <h4 className="text-sm font-semibold text-gray-800 mb-3">Status</h4>
//                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                       {allStatusOptions.map((opt) => (
//                         <label
//                           key={opt.key}
//                           className="flex items-center gap-2 rounded-md border border-transparent hover:border-gray-200 bg-white px-3 py-2"
//                         >
//                           <input
//                             type="checkbox"
//                             checked={!!tmpStatuses[opt.key]}
//                             onChange={() => toggleStatus(opt.key)}
//                             className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-2 focus:ring-blue-500"
//                           />
//                           <span className="text-gray-700 text-sm">{opt.label}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-6 flex items-center justify-end gap-6">
//                   <button type="button" onClick={clearFilters} className="text-blue-600 font-semibold hover:underline">
//                     Clear filters
//                   </button>
//                   <button
//                     type="button"
//                     onClick={applyFilters}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium"
//                   >
//                     Apply
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Table */}
//           <div className="px-6 pb-2 text-sm text-gray-600">
//             {from}-{to} of {total}
//           </div>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     File
//                   </th>
//                   <th
//                     onClick={toggleSort}
//                     className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
//                   >
//                     <div className="inline-flex items-center gap-1">
//                       Creation Date
//                       {sortDir === "desc" ? (
//                         <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
//                           <path d="M5 8l5 5 5-5H5z" />
//                         </svg>
//                       ) : (
//                         <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
//                           <path d="M5 12l5-5 5 5H5z" />
//                         </svg>
//                       )}
//                     </div>
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filtered.map((row) => (
//                   <tr key={row.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-start gap-3">
//                         <div className="mt-1">
//                           <FaFilePdf className="text-blue-500" />
//                         </div>
//                         <div>
//                           <div className="text-sm font-medium text-gray-900">{row.fileName}</div>
//                           <a href="#" className="text-sm text-blue-600 hover:underline">
//                             {row.recipientName}
//                           </a>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">{formatDate(row.createdAt)}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <StatusBadge status={row.status} />
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <RowActions
//                         row={row}
//                         disabled={true /* pending: main Download disabled */}
//                         onDownload={handleDownload}
//                         onView={handleView}
//                         onAudit={handleAudit}
//                         onOriginal={handleOriginal}
//                         onDelete={handleDelete}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//                 {filtered.length === 0 && (
//                   <tr>
//                     <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
//                       No pending requests match your filters.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//           <div className="px-6 pt-2 pb-6 text-sm text-gray-600">
//             {from}-{to} of {total}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
