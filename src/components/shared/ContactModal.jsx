"use client"

import { useEffect, useState, useRef } from "react"
import { FaTimes } from "react-icons/fa"

export default function ContactModal({ open, contact, onClose, onSubmit }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState({})
  const panelRef = useRef(null)

  // Initialize fields whenever modal opens or contact changes
  useEffect(() => {
    if (open) {
      setName(contact?.name || "")
      setEmail(contact?.email || "")
      setPhone(contact?.phone || "")
      setErrors({})
      // Focus first field when opening
      setTimeout(() => {
        if (panelRef.current) {
          const first = panelRef.current.querySelector("input[name='name']")
          first?.focus()
        }
      }, 0)
    }
  }, [open, contact])

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return
      if (e.key === "Escape") onClose?.()
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSave()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, name, email, phone])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = "Required"
    if (!email.trim()) errs.email = "Required"
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Invalid email"
    if (!phone.trim()) errs.phone = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const payload = {
      id: contact?.id || undefined,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    }
    onSubmit?.(payload)
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{contact ? "Edit contact" : "Add contact"}</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? "border-blue-300" : "border-gray-300"
                }`}
              placeholder="Full name"
            />
            {errors.name && <p className="mt-1 text-sm text-blue-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? "border-blue-300" : "border-gray-300"
                }`}
              placeholder="name@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-blue-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? "border-blue-300" : "border-gray-300"
                }`}
              placeholder="+92 3xx xxxxxxx"
            />
            {errors.phone && <p className="mt-1 text-sm text-blue-600">{errors.phone}</p>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
