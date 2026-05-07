import { HashRouter, Routes, Route } from 'react-router-dom'
import { SidebarApp } from '@/components/app/sidebar'
import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-provider'
import { useEffect, useRef } from 'react'
import axios from 'axios'
import { PEMINJAMAN_API_URL } from '@/constants/constant'
import { toast } from 'sonner'

import Home from './pages/Home/Home'
import ManajemenBuku from './pages/Manajemen-buku/manajemen-buku'
import ManajemenAnggota from './pages/Manajemen-anggota/manajemen-anggota'
import ManajemenPinjaman from './pages/Manajemen-pinjaman/manajemen-pinjaman'
import Notifikasi from './pages/Notifikasi/Notifikasi'

export default function App() {
  const { theme } = useTheme()
  const hasNotified = useRef(false)

  useEffect(() => {
    const checkOverdue = async () => {
      if (hasNotified.current) return

      try {
        const response = await axios.get(`${PEMINJAMAN_API_URL}/overdue`)
        const overdueData = response.data.data

        if (overdueData.length > 0) {
          overdueData.forEach((item: any, index: number) => {
            setTimeout(() => {
              toast.error(`Buku Terlambat!`, {
                description: `${item.anggota.nama} belum mengembalikan "${item.buku.judul}"`,
                duration: 6000
              })
            }, index * 300)
          })
          hasNotified.current = true
        }
      } catch (error) {
        console.error('gagal fetch global notifications:', error)
      }
    }

    checkOverdue()
  }, [])

  return (
    <HashRouter>
      <div>
        <SidebarApp>
          <Routes>
            <Route index element={<Home />} />
            <Route path="/manajemen-buku" element={<ManajemenBuku />} />
            <Route path="/manajemen-anggota" element={<ManajemenAnggota />} />
            <Route path="/manajemen-pinjaman" element={<ManajemenPinjaman />} />
            <Route path="/notifikasi" element={<Notifikasi />} />
          </Routes>
        </SidebarApp>
      </div>
      <Toaster
        theme={theme === 'dark' ? 'dark' : 'light'}
        position='top-center'
        offset={{
          top: 50
        }}
        closeButton={true}
      />
    </HashRouter>
  )
}
