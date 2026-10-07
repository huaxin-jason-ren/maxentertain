'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/maxowner/bookings', label: 'Bookings', icon: '📆' },
  { href: '/maxowner/offers', label: 'Offers', icon: '🏷️' },
  { href: '/maxowner/guests', label: 'Guests', icon: '👥' },
  { href: '/maxowner/pricing', label: 'Pricing', icon: '💰' },
  { href: '/maxowner/inquiries', label: 'Inquiries', icon: '📋' },
  { href: '/maxowner/chats', label: 'Chats', icon: '💬' },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (pathname === '/maxowner/login') return <>{children}</>

  const handleLogout = async () => {
    await fetch('/api/maxowner/auth/logout', { method: 'POST' })
    router.push('/maxowner/login')
  }

  const SidebarContent = (
    <>
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <span className="text-luxury-gold font-serif tracking-widest text-base">MAX OWNER</span>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-white"
          aria-label="Close menu"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ↗ View site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors rounded-lg"
        >
          ⎋ Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#0f0f0d] overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-[#1a1a18] border-b border-white/10 px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-300 hover:text-white"
          aria-label="Open menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <span className="text-luxury-gold font-serif tracking-widest text-sm">MAX OWNER</span>
        <span className="w-6" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#1a1a18] border-r border-white/10 flex-col">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-[#1a1a18] border-r border-white/10 flex flex-col">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
