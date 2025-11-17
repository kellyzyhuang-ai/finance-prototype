import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Financial Assistant Study',
  description: 'Master\'s thesis study on AI financial assistants for older adults',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}



