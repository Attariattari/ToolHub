"use client"

import { useState } from "react"
import { FiTrash2 } from "react-icons/fi"

function PremiumBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800">
      Premium
    </span>
  )
}

function SettingRow({ title, description, checked, onChange, children, premium = false, disabled = false }) {
  return (
    <div className="py-4">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {premium && <PremiumBadge />}
          </div>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  )
}

const SigningOptionsModal = ({
  isOpen,
  onModeSelect,
  signingMode,
  signers,
  onAddSigner,
  onRemoveSigner,
  onUpdateSigner,
  fileName,
  onSettingsSave, // Added prop to save settings to main page
}) => {
  const [newSignerName, setNewSignerName] = useState("")
  const [newSignerEmail, setNewSignerEmail] = useState("")

  const [settings, setSettings] = useState({
    signingOrder: false,
    expireEnabled: true,
    expireDays: 15,
    multiRequest: false,
    emailNotif: true,
    remindersEnabled: true,
    reminderDays: 1,
    customizeEmail: false,
    subject: "Please sign the document",
    body: "Hi,\nKindly review and sign the attached document.\nThanks.",
    uuidEnabled: true,
    verifyCode: true,
  })

  const handleAddNewSigner = () => {
    if (newSignerName.trim() && newSignerEmail.trim()) {
      onAddSigner({
        name: newSignerName.trim(),
        email: newSignerEmail.trim(),
      })
      setNewSignerName("")
      setNewSignerEmail("")
    }
  }

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const expiryDate = (() => {
    if (!settings.expireEnabled) return null
    const d = new Date()
    d.setDate(d.getDate() + (Number.parseInt(settings.expireDays || 0, 10) || 0))
    return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
  })()

  if (!isOpen) return null

  if (signingMode === "several-people") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Add new signer */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Add Signers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newSignerEmail}
                  onChange={(e) => setNewSignerEmail(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAddNewSigner}
                disabled={!newSignerName.trim() || !newSignerEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Add Signer
              </button>
            </div>

            {/* Signers list */}
            {signers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Signers ({signers.length})</h3>
                <div className="space-y-3">
                  {signers.map((signer) => (
                    <div key={signer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{signer.name}</div>
                        <div className="text-sm text-gray-600">{signer.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRemoveSigner(signer.id)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Document Settings</h3>
              <div className="divide-y divide-gray-200">
                <SettingRow
                  title="Set the order of receivers"
                  description="Select this option to set a signing order. A signer won't receive a request until the previous person has completed their document."
                  checked={settings.signingOrder}
                  onChange={(value) => updateSetting("signingOrder", value)}
                />

                <SettingRow
                  title="Change expiration date"
                  description={`The document will expire in ${settings.expireDays} day${settings.expireDays === 1 ? "" : "s"}. ${expiryDate ? "Expires on " + expiryDate + "." : ""}`}
                  checked={settings.expireEnabled}
                  onChange={(value) => updateSetting("expireEnabled", value)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={settings.expireDays}
                      onChange={(e) => updateSetting("expireDays", e.target.value)}
                      className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-700">days</span>
                  </div>
                </SettingRow>

                <SettingRow
                  title="Multiple requests"
                  description="Each signer receives a unique request to sign individually."
                  checked={settings.multiRequest}
                  onChange={(value) => updateSetting("multiRequest", value)}
                  premium
                />

                <SettingRow
                  title="Enable email notifications"
                  description="You will receive an email notification when a receiver has completed their request."
                  checked={settings.emailNotif}
                  onChange={(value) => updateSetting("emailNotif", value)}
                />

                <SettingRow
                  title="Enable reminders"
                  description={`Send a reminder to the participants every ${settings.reminderDays} day${settings.reminderDays === 1 ? "" : "s"}.`}
                  checked={settings.remindersEnabled}
                  onChange={(value) => updateSetting("remindersEnabled", value)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={settings.reminderDays}
                      onChange={(e) => updateSetting("reminderDays", e.target.value)}
                      className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-700">days</span>
                  </div>
                </SettingRow>

                <SettingRow
                  title="Customize the request email"
                  description="Edit the text you want to appear in the subject and body of the signature request email."
                  checked={settings.customizeEmail}
                  onChange={(value) => updateSetting("customizeEmail", value)}
                >
                  {settings.customizeEmail && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                          value={settings.subject}
                          onChange={(e) => updateSetting("subject", e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Email subject"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Body</label>
                        <textarea
                          rows={4}
                          value={settings.body}
                          onChange={(e) => updateSetting("body", e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Email body"
                        />
                      </div>
                    </div>
                  )}
                </SettingRow>

                <SettingRow
                  title="UUID (recommended)"
                  description="Show the Unique Signer Identifier code on the audit trail to validate signatures."
                  checked={settings.uuidEnabled}
                  onChange={(value) => updateSetting("uuidEnabled", value)}
                />

                <SettingRow
                  title="Signature verification code"
                  description="Verify the integrity of the printed document using a QR code and a unique password (included in the Audit Trail)."
                  checked={settings.verifyCode}
                  onChange={(value) => updateSetting("verifyCode", value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => onModeSelect(null)}
              className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <div className="flex flex-col items-end">
              {signers.length === 0 && <p className="text-sm text-blue-600 mb-2">At least one signer is required</p>}
              <button
                onClick={() => {
                  onSettingsSave?.(settings)
                  onModeSelect(null)
                }}
                disabled={signers.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Who will sign this document?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Only me option */}
          <div
            onClick={() => onModeSelect("only-me")}
            className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 cursor-pointer transition-colors duration-200 group"
          >
            <div className="mb-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-dFXRq7LxZy5boit25QRCC4afokEpsh.png"
                alt="Only me"
                className="w-24 h-24 mx-auto object-contain"
              />
            </div>
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
              Only me
            </button>
            <p className="text-gray-600 mt-3">Sign this document</p>
          </div>

          {/* Several people option */}
          <div
            onClick={() => onModeSelect("several-people")}
            className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 cursor-pointer transition-colors duration-200 group"
          >
            <div className="mb-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-dFXRq7LxZy5boit25QRCC4afokEpsh.png"
                alt="Several people"
                className="w-24 h-24 mx-auto object-contain"
              />
            </div>
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
              Several people
            </button>
            <p className="text-gray-600 mt-3">Invite others to sign</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span>📄</span>
            Uploaded documents: {fileName}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SigningOptionsModal
