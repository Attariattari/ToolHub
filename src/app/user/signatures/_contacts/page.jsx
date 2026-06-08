"use client"

import { useMemo, useState } from "react"
import { FaFilePdf, FaSearch, FaTrash, FaEdit } from "react-icons/fa"
import ContactModal from "@/components/shared/ContactModal"

function cn(...c) {
  return c.filter(Boolean).join(" ")
}

const seedContacts = [
  { id: "c-1", name: "Rashid Ali", email: "rashid.ali@example.com", phone: "+92 300 1234567" },
  { id: "c-2", name: "Ahsan Iqbal", email: "ahsan.iqbal@example.com", phone: "+92 333 7654321" },
  { id: "c-3", name: "Hira Khan", email: "hira.khan@example.com", phone: "+92 301 9876543" },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState(seedContacts)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts
    const q = query.toLowerCase()
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    )
  }, [contacts, query])

  const handleAdd = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleEdit = (row) => {
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row) => {
    if (confirm(`Delete contact "${row.name}"?`)) {
      setContacts((prev) => prev.filter((c) => c.id !== row.id))
    }
  }

  const handleSubmit = (payload) => {
    // Add new
    if (!payload.id) {
      const id = "c-" + Date.now()
      setContacts((prev) => [{ id, ...payload }, ...prev])
      return
    }
    // Update
    setContacts((prev) => prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c)))
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (same style as other signature pages) */}
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
            Add contact
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
          </div>

          {/* Toolbar: left search only */}
          <div className="px-6 pb-4 mt-4">
            <form onSubmit={(e) => e.preventDefault()} className="max-w-md" role="search">
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full border border-gray-300 rounded-md bg-white pl-9 pr-3 py-2 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-2 text-gray-600 hover:text-gray-900"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      No contacts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 pt-2 pb-6 text-sm text-gray-600">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Single reusable modal for Add/Edit (all logic lives inside the modal component) */}
      <ContactModal open={open} contact={editing} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
