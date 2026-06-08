import '@/app/globals.css'
import { BlogsProvider } from '@/context/Blog.context';
import { SignatureProvider } from '@/context/Signature.context';
import SocketIoProvider from '@/context/SocketIoContext';
import { TaskProvider } from '@/context/Task.context';
import { ThemeProvider } from "@/context/theme-provider";
import { UserProvider } from "@/context/User.context";

export const metadata = {
  title: "PDFDEX - Free Online PDFDEX",
  description:
    "Free online PDFDEX for merging, splitting, compressing, and converting PDF files. Fast, secure, and easy to use.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground transition-colors duration-300">
        <UserProvider>
          <SocketIoProvider>
            <TaskProvider>
              <SignatureProvider>
                <BlogsProvider>
                  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {children}
                  </ThemeProvider>
                </BlogsProvider>
              </SignatureProvider>
            </TaskProvider>
          </SocketIoProvider>
        </UserProvider>
      </body>
    </html>
  )
}
