"use client"

import TemplateModal from "@/components/shared/TemplateModal"
import { useMemo, useState } from "react"
import { FaFilePdf, FaSearch, FaEdit, FaTrash } from "react-icons/fa"

const seedTemplates = [
  {
    id: "t-1",
    name: "NDA (Mutual)",
    description: "Mutual non-disclosure agreement protecting confidential information between both parties.",
    tags: ["Legal", "NDA"],
    updatedAt: "2025-07-01T12:00:00Z",
  },
  {
    id: "t-2",
    name: "Offer Letter",
    description: "Standard employment offer with role, compensation, and start date placeholders.",
    tags: ["HR"],
    updatedAt: "2025-06-20T09:15:00Z",
  },
  {
    id: "t-3",
    name: "Service Agreement",
    description: "Master service agreement template for vendors or contractors.",
    tags: ["Legal", "Vendor"],
    updatedAt: "2025-06-12T16:30:00Z",
  },
  {
    id: "t-4",
    name: "Sales Contract",
    description: "Sales terms and conditions with pricing and delivery placeholders.",
    tags: ["Sales"],
    updatedAt: "2025-05-28T08:45:00Z",
  },
  {
    id: "t-5",
    name: "Consulting Agreement",
    description: "Consulting scope, fees, and confidentiality clauses.",
    tags: ["Legal", "Consulting"],
    updatedAt: "2025-05-10T10:00:00Z",
  },
  {
    id: "t-6",
    name: "Lease Agreement",
    description: "Basic commercial lease terms for property rentals.",
    tags: ["Real Estate"],
    updatedAt: "2025-04-18T14:05:00Z",
  },
]

function formatDate(dt) {
  const d = new Date(dt)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(seedTemplates)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return templates
    const q = query.toLowerCase()
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [templates, query])

  const handleAdd = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleEdit = (tpl) => {
    setEditing(tpl)
    setOpen(true)
  }

  const handleDelete = (tpl) => {
    if (confirm(`Delete template "${tpl.name}"?`)) {
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id))
    }
  }

  const handleUse = (tpl) => {
    alert(`Starting signature flow using template: ${tpl.name}`)
  }

  const handleSubmit = (payload) => {
    if (!payload.id) {
      const id = "t-" + Date.now()
      setTemplates((prev) => [{ id, ...payload }, ...prev])
      return
    }
    setTemplates((prev) => prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)))
  }

  return (
    <div className="bg-gray-50">
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
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add template
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
          </div>

          {/* Search only (left) */}
          <div className="px-6 pb-4 mt-4">
            <form onSubmit={(e) => e.preventDefault()} className="max-w-md" role="search">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full border border-gray-300 rounded-md bg-white pl-9 pr-3 py-2 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
          </div>

          {/* Grid */}
          <div className="px-6 pb-6">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">No templates found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
                  >
                    {/* Preview area */}
                    <div className="h-28 bg-gray-50 flex items-center justify-center">
                      <div className="text-2xl font-semibold text-gray-300 select-none">
                        {tpl.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{tpl.name}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{tpl.description}</p>
                        </div>

                        {/* Icon-only actions (no bg / no border) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(tpl)}
                            className="p-1.5 text-gray-600 hover:text-gray-900"
                            aria-label="Edit template"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(tpl)}
                            className="p-1.5 text-blue-600 hover:text-blue-700"
                            aria-label="Delete template"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {/* Tags */}
                      {tpl.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tpl.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Updated {formatDate(tpl.updatedAt)}</span>
                        <button
                          onClick={() => handleUse(tpl)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Use template
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      <TemplateModal open={open} template={editing} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
