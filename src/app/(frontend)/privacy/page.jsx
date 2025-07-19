"use client"

import { motion } from "framer-motion"

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#fffefe] min-h-screen py-10">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: June 1, 2024</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                At PDF ToolsHub, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you visit our website and use our PDF processing tools.
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
                please do not access the site.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Personal Data</h3>
              <p>
                When you register for an account, we may collect personally identifiable information, such as your:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Username</li>
                <li>Payment information (for premium services)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">PDF Files and Document Data</h3>
              <p>
                When you use our PDF tools, you may upload documents to our service. We want to be clear about how we
                handle this data:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>Browser Processing:</strong> Most of our tools process your files directly in your browser. The
                  content of your documents does not reach our servers.
                </li>
                <li>
                  <strong>Temporary Storage:</strong> For tools that require server-side processing, files are
                  temporarily stored on our secure servers only for the duration needed to complete the requested
                  operation.
                </li>
                <li>
                  <strong>Automatic Deletion:</strong> All uploaded files are automatically deleted after processing or
                  within a maximum of 24 hours.
                </li>
                <li>
                  <strong>No Content Analysis:</strong> We do not analyze, read, or mine the content of your documents
                  for any purpose.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Usage Data</h3>
              <p>
                We may also collect information on how the website is accessed and used ("Usage Data"). This Usage Data
                may include information such as your computer's Internet Protocol address (e.g., IP address), browser
                type, browser version, the pages of our website that you visit, the time and date of your visit, the time
                spent on those pages, unique device identifiers, and other diagnostic data.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Use of Your Information</h2>
              <p>PDF ToolsHub may use the information we collect from you for various purposes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To allow you to participate in interactive features of our service when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To fulfill any other purpose for which you provide it</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Integrations</h2>
              <p>
                Our service allows you to upload files from and save files to third-party services such as Google Drive
                and Dropbox. When you connect your account with these services, we may collect information that these
                services make available to us, such as your name, profile picture, and email address associated with that
                account.
              </p>
              <p>
                We will use this information only for the specific purpose of providing the functionality of connecting
                to these services. Our access to your third-party account is limited to what is necessary to provide our
                service and what you have authorized.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Social Login</h2>
              <p>
                We offer you the ability to register and login using your third-party social media account details (like
                your Google or Facebook logins). Where you choose to do this, we will receive certain profile information
                about you from your social media provider. The profile information we receive may vary depending on the
                social media provider concerned, but will often include your name, email address, profile picture, and
                other information you choose to make public on such social media platform.
              </p>
              <p>
                We will use the information we receive only for the purposes that are described in this privacy policy or
                that are otherwise made clear to you on the relevant website. Please note that we do not control, and are
                not responsible for, other uses of your personal information by your third-party social media provider.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the
                security of any personal information we process. However, despite our safeguards and efforts to secure
                your information, no electronic transmission over the Internet or information storage technology can be
                guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other
                unauthorized third parties will not be able to defeat our security and improperly collect, access, steal,
                or modify your information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Data Protection Rights</h2>
              <p>
                If you are a resident of the European Economic Area (EEA), you have certain data protection rights. PDF
                ToolsHub aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your
                Personal Data.
              </p>
              <p>You have the following data protection rights:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  The right to access, update or delete the information we have on you. Whenever made possible, you can
                  access, update or request deletion of your Personal Data directly within your account settings section.
                </li>
                <li>
                  The right of rectification. You have the right to have your information rectified if that information
                  is inaccurate or incomplete.
                </li>
                <li>
                  The right to object. You have the right to object to our processing of your Personal Data.
                </li>
                <li>
                  The right of restriction. You have the right to request that we restrict the processing of your
                  personal information.
                </li>
                <li>
                  The right to data portability. You have the right to be provided with a copy of the information we have
                  on you in a structured, machine-readable and commonly used format.
                </li>
                <li>
                  The right to withdraw consent. You also have the right to withdraw your consent at any time where PDF
                  ToolsHub relied on your consent to process your personal information.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                Policy are effective when they are posted on this page.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@pdftoolshub.com" className="text-red-600 hover:underline">
                  privacy@pdftoolshub.com
                </a>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
