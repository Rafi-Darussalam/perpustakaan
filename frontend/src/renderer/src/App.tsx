import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SidebarApp } from '@/components/app/sidebar'
import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-provider'
import { useEffect, useRef } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

import Home from './pages/admin/Home/Home'
import ManajemenBuku from './pages/admin/Manajemen-buku/manajemen-buku'
import ManajemenAnggota from './pages/admin/Manajemen-anggota/manajemen-anggota'
import Notifikasi from './pages/admin/Notifikasi/Notifikasi'
import ManajemenPeminjaman from './pages/admin/Manajemen-peminjaman/manajemen-peminjaman'
import UserBookPage from './pages/user/Book/Book'
import UserHome from './pages/user/Home/Home'
import GuestHome from './pages/guest/GuestHome'
import UserPeminjaman from './pages/user/Peminjaman/Peminjaman'
import UserNotifikasi from './pages/user/Notifikasi/Notifikasi'
import { authClient } from '@/lib/auth-client'

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-0">
      <div className="relative w-12 h-12" aria-hidden>
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
    </div>
  )
}

function ProtectedUserRoute({
  session,
  children
}: {
  session: any
  children: React.ReactNode
}) {
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { theme } = useTheme()
  const hasNotified = useRef(false)

  const { data: session, isPending } = authClient.useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (!session) return

    const checkOverdue = async () => {
      if (hasNotified.current) return

      try {
        if (isAdmin) {
          const response = await api.get('/peminjaman/overdue')
          const overdueData = response.data.data

          if (overdueData.length > 0) {
            overdueData.forEach(
              (item: { anggota: { nama: string }; buku: { judul: string } }, index: number) => {
                setTimeout(() => {
                  toast.error('Buku Terlambat!', {
                    description: `${item.anggota.nama} belum mengembalikan "${item.buku.judul}"`,
                    duration: 6000
                  })
                }, index * 300)
              }
            )
            hasNotified.current = true
          }
        } else {
          const response = await api.get('/peminjaman/my-overdue')
          const overdueData = response.data.data

          if (overdueData.length > 0) {
            overdueData.forEach(
              (item: { buku: { judul: string } }, index: number) => {
                setTimeout(() => {
                  toast.error('Peringatan Keterlambatan!', {
                    description: `Anda terlambat mengembalikan buku "${item.buku.judul}". Harap segera dikembalikan.`,
                    duration: 6000
                  })
                }, index * 300)
              }
            )
            hasNotified.current = true
          }
        }
      } catch (error) {
        console.error('gagal fetch global notifications:', error)
      }
    }

    checkOverdue()
  }, [session, isAdmin])

  if (isPending) {
    return <LoadingScreen />
  }

  return (
    <HashRouter>
      <div>
        <SidebarApp>
          <Routes>
            {isAdmin ? (
              <>
                <Route index element={<Home />} />
                <Route path="/manajemen-buku" element={<ManajemenBuku />} />
                <Route path="/manajemen-anggota" element={<ManajemenAnggota />} />
                <Route path="/manajemen-peminjaman" element={<ManajemenPeminjaman />} />
                <Route path="/notifikasi" element={<Notifikasi />} />
              </>
            ) : (
              <>
                <Route index element={session ? <UserHome /> : <GuestHome />} />
                <Route path="/buku" element={<UserBookPage />} />
                <Route
                  path="/peminjaman"
                  element={
                    <ProtectedUserRoute session={session}>
                      <UserPeminjaman />
                    </ProtectedUserRoute>
                  }
                />
                <Route
                  path="/notifikasi"
                  element={
                    <ProtectedUserRoute session={session}>
                      <UserNotifikasi />
                    </ProtectedUserRoute>
                  }
                />
              </>
            )}
          </Routes>
        </SidebarApp>
      </div>
      <Toaster
        theme={theme === 'dark' ? 'dark' : 'light'}
        position="top-center"
        offset={{ top: 50 }}
        closeButton={true}
      />
    </HashRouter>
  )
}
