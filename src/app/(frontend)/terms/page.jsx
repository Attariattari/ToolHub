"use client"

import { motion } from "framer-motion"

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#fffefe] min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last Updated: June 1, 2024</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Welcome to PDF ToolsHub. Please read these Terms of Service ("Terms", "Terms of Service") carefully
                before using the PDF ToolsHub website and PDF processing tools (the "Service") operated by PDF ToolsHub
                ("us", "we", or "our").
              </p>
              <p>
                Your access to and use of the Service is conditioned on your acceptance of and compliance with these
                Terms. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
              <p>
                By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of
                the terms, then you may not access the Service.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Use of Service</h2>
              <p>
                PDF ToolsHub provides various tools for processing PDF documents. By using our Service, you agree to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use the Service only for lawful purposes and in accordance with these Terms.</li>
                <li>
                  Not use the Service in any way that violates any applicable federal, state, local, or international
                  law or regulation.
                </li>
                <li>
                  Not use the Service to transmit, upload, or process any material that infringes any copyright,
                  trademark, patent, trade secret, or other intellectual property rights of others.
                </li>
                <li>
                  Not attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the
                  Service, the server on which the Service is stored, or any server, computer, or database connected to
                  the Service.
                </li>
                <li>
                  Not overwhelm or attempt to overwhelm our infrastructure by imposing an unreasonably large load on our
                  systems.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current
                at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate
                termination of your account on our Service.
              </p>
              <p>
                You are responsible for safeguarding the password that you use to access the Service and for any
                activities or actions under your password, whether your password is with our Service or a third-party
                service.
              </p>
              <p>
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming
                aware of any breach of security or unauthorized use of your account.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive
                property of PDF ToolsHub and its licensors. The Service is protected by copyright, trademark, and other
                laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in
                connection with any product or service without the prior written consent of PDF ToolsHub.
              </p>
              <p>
                You retain all of your rights to any content you submit, upload, or display on or through the Service.
                By uploading content to our Service, you grant us a worldwide, non-exclusive, royalty-free license to
                use, process, and store your content solely for the purpose of providing the Service to you.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. User Content and Document Processing</h2>
              <p>
                Our Service allows you to upload, process, and download PDF documents and other file formats. You are
                solely responsible for the content of the files you upload and process using our Service.
              </p>
              <p>Regarding your uploaded documents:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>Ownership:</strong> We claim no ownership rights over the documents you upload or create using
                  our Service.
                </li>
                <li>
                  <strong>Privacy:</strong> Most of our tools process your files directly in your browser. For tools
                  that require server-side processing, files are temporarily stored on our secure servers only for the
                  duration needed to complete the requested operation.
                </li>
                <li>
                  <strong>Automatic Deletion:</strong> All uploaded files are automatically deleted after processing or
                  within a maximum of 24 hours.
                </li>
                <li>
                  <strong>No Content Analysis:</strong> We do not analyze, read, or mine the content of your documents
                  for any purpose other than providing the requested service.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Third-Party Integrations</h2>
              <p>
                Our Service allows you to connect with third-party services such as Google Drive, Dropbox, and social
                login providers. By using these integrations, you authorize PDF ToolsHub to access and interact with
                these services on your behalf, subject to the respective terms and privacy policies of those services.
              </p>
              <p>
                We are not responsible for the content, privacy policies, or practices of any third-party services. You
                acknowledge and agree that PDF ToolsHub shall not be responsible or liable, directly or indirectly, for
                any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any
                such content, goods, or services available on or through any such third-party services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Free and Premium Services</h2>
              <p>
                PDF ToolsHub offers both free and premium (paid) services. The features and limitations of each service
                tier are described on our website.
              </p>
              <p>
                For premium services, you agree to pay all fees or charges to your account based on the pricing and
                billing terms presented to you at the time of purchase. You are responsible for providing current,
                complete, and accurate billing and contact information.
              </p>
              <p>
                We reserve the right to change our prices at any time. If we do change prices, we will provide notice of
                the change on the Site or by email, at our option, at least 30 days before the change is to take effect.
                Your continued use of the Service after the price change becomes effective constitutes your agreement to
                pay the changed amount.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
              <p>
                In no event shall PDF ToolsHub, nor its directors, employees, partners, agents, suppliers, or
                affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                resulting from:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>
                  Any content obtained from the Service; and unauthorized access, use, or alteration of your
                  transmissions or content, whether based on warranty, contract, tort (including negligence), or any
                  other legal theory, whether or not we have been informed of the possibility of such damage.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Disclaimer</h2>
              <p>
                Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE"
                basis. The Service is provided without warranties of any kind, whether express or implied, including,
                but not limited to, implied warranties of merchantability, fitness for a particular purpose,
                non-infringement, or course of performance.
              </p>
              <p>
                PDF ToolsHub does not warrant that a) the Service will function uninterrupted, secure, or available at
                any particular time or location; b) any errors or defects will be corrected; c) the Service is free of
                viruses or other harmful components; or d) the results of using the Service will meet your requirements.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of the United States, without
                regard to its conflict of law provisions.
              </p>
              <p>
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those
                rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining
                provisions of these Terms will remain in effect.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
                revision is material, we will try to provide at least 30 days' notice prior to any new terms taking
                effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use our Service after those revisions become effective, you agree to be bound
                by the revised terms. If you do not agree to the new terms, please stop using the Service.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@pdftoolshub.com" className="text-red-600 hover:underline">
                  legal@pdftoolshub.com
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
