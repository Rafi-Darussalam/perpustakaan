import { HashRouter, Routes, Route } from 'react-router-dom'
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
import UserCatalog from './pages/User/Home'
import { authClient } from '@/lib/auth-client'

export default function App() {
  const { theme } = useTheme()
  const hasNotified = useRef(false)

  const { data: session } = authClient.useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (!session || !isAdmin) return

    const checkOverdue = async () => {
      if (hasNotified.current) return

      try {
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
      } catch (error) {
        console.error('gagal fetch global notifications:', error)
      }
    }

    checkOverdue()
  }, [session, isAdmin])

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
                <Route path="/notifikasi" element={<Notifikasi />} />
              </>
            ) : (
              <>
                <Route index element={<UserCatalog />} />
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
