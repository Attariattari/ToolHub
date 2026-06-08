"use client"

import { useEffect, useRef, useState } from "react"
import { FaTimes } from "react-icons/fa"

export default function TemplateModal({ open, template, onClose, onSubmit }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [errors, setErrors] = useState({})
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setName(template?.name || "")
    setDescription(template?.description || "")
    setTags((template?.tags || []).join(", "))
    setErrors({})
    setTimeout(() => {
      const el = panelRef.current?.querySelector("#tpl-name")
      el?.focus()
    }, 0)
  }, [open, template])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = "Required"
    if (!description.trim()) errs.description = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onSubmit?.({
      id: template?.id,
      name: name.trim(),
      description: description.trim(),
      tags: parsedTags,
      updatedAt: new Date().toISOString(),
    })
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-xl rounded-xl bg-white shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{template ? "Edit template" : "Add template"}</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="tpl-name" className="block text-sm font-medium text-gray-700">
              Template name
            </label>
            <input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? "border-blue-300" : "border-gray-300"
                }`}
              placeholder="e.g. NDA, Offer Letter"
            />
            {errors.name && <p className="mt-1 text-sm text-blue-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="tpl-desc" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="tpl-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? "border-blue-300" : "border-gray-300"
                }`}
              placeholder="Short description of when and how to use this template"
            />
            {errors.description && <p className="mt-1 text-sm text-blue-600">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="tpl-tags" className="block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <input
              id="tpl-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
              placeholder="HR, Legal, Sales"
            />
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
