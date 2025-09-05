import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'GPT-OSS Local',
  description: 'Offline local assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}


