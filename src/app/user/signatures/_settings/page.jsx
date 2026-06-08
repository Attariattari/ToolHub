"use client"

import { useMemo, useState } from "react"
import { FaFilePdf } from "react-icons/fa"

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

export default function SignatureSettingsPage() {
  // State
  const [signingOrder, setSigningOrder] = useState(false)
  const [expireEnabled, setExpireEnabled] = useState(true)
  const [expireDays, setExpireDays] = useState(15)

  const [multiRequest, setMultiRequest] = useState(false) // premium tag only, no special logic

  const [emailNotif, setEmailNotif] = useState(true)
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [reminderDays, setReminderDays] = useState(1)

  const [digitalSignature, setDigitalSignature] = useState(true) // premium tag
  const [language, setLanguage] = useState("en")

  const [customizeEmail, setCustomizeEmail] = useState(false)
  const [subject, setSubject] = useState("Please sign the document")
  const [body, setBody] = useState("Hi,\nKindly review and sign the attached document.\nThanks.")

  const [uuidEnabled, setUuidEnabled] = useState(true)
  const [verifyCode, setVerifyCode] = useState(true)

  const [emailBranding, setEmailBranding] = useState(false) // premium tag

  const expiryDate = useMemo(() => {
    if (!expireEnabled) return null
    const d = new Date()
    d.setDate(d.getDate() + (Number.parseInt(expireDays || 0, 10) || 0))
    return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
  }, [expireEnabled, expireDays])

  const handleSave = () => {
    const payload = {
      signingOrder,
      expiration: expireEnabled ? { enabled: true, days: Number(expireDays) } : { enabled: false },
      multipleRequests: multiRequest,
      emailNotifications: emailNotif,
      reminders: remindersEnabled ? { enabled: true, everyDays: Number(reminderDays) } : { enabled: false },
      digitalSignature,
      language,
      customizeEmail: customizeEmail ? { subject, body } : null,
      uuid: uuidEnabled,
      verificationCode: verifyCode,
      emailBranding,
    }
    console.log("Settings saved:", payload)
    alert("Settings saved")
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (consistent with other pages) */}
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
          <div />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>

          <div className="px-6 py-4 divide-y divide-gray-200">
            <SettingRow
              title="Set the order of receivers"
              description="Select this option to set a signing order. A signer won’t receive a request until the previous person has completed their document."
              checked={signingOrder}
              onChange={setSigningOrder}
            />

            <SettingRow
              title="Change expiration date"
              description={`The document will expire in ${expireDays} day${expireDays === 1 ? "" : "s"}. ${expiryDate ? "Expires on " + expiryDate + "." : ""}`}
              checked={expireEnabled}
              onChange={setExpireEnabled}
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={expireDays}
                  onChange={(e) => setExpireDays(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-700">days</span>
              </div>
            </SettingRow>

            <SettingRow
              title="Multiple requests"
              description="Each signer receives a unique request to sign individually."
              checked={multiRequest}
              onChange={setMultiRequest}
              premium
            />

            <SettingRow
              title="Enable email notifications"
              description="You will receive an email notification when a receiver has completed their request."
              checked={emailNotif}
              onChange={setEmailNotif}
            />

            <SettingRow
              title="Enable reminders"
              description={`Send a reminder to the participants every ${reminderDays} day${reminderDays === 1 ? "" : "s"}.`}
              checked={remindersEnabled}
              onChange={setRemindersEnabled}
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-700">days</span>
              </div>
            </SettingRow>

            <SettingRow
              title="Digital Signature"
              description="A signed Certified Hash and a Qualified Timestamp is embedded to the signed documents, ensuring the future integrity of the document and signature."
              checked={digitalSignature}
              onChange={setDigitalSignature}
              premium
            />

            <SettingRow
              title="Set language"
              description={`Notifications will be sent in ${language === "en" ? "English" : language === "ur" ? "Urdu" : "Arabic"}.`}
              checked={true}
              onChange={() => { }}
              disabled
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
              </select>
            </SettingRow>

            <SettingRow
              title="Customize the request email"
              description="Edit the text you want to appear in the subject and body of the signature request email."
              checked={customizeEmail}
              onChange={setCustomizeEmail}
            >
              {customizeEmail && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Body</label>
                    <textarea
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
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
              checked={uuidEnabled}
              onChange={setUuidEnabled}
            />

            <SettingRow
              title="Signature verification code"
              description="Verify the integrity of the printed document using a QR code and a unique password (included in the Audit Trail)."
              checked={verifyCode}
              onChange={setVerifyCode}
            />

            <SettingRow
              title="Email branding"
              description="Include the company name and logo in the signature request email."
              checked={emailBranding}
              onChange={setEmailBranding}
              premium
            />
          </div>

          {/* Footer actions */}
          <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
