import { HashRouter, Routes, Route } from 'react-router-dom'
import { SidebarApp } from '@/components/app/sidebar'
import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-provider'

import Home from './pages/Home/Home'
import ManajemenBuku from './pages/Manajemen-buku/manajemen-buku'
import ManajemenAnggota from './pages/Manajemen-anggota/manajemen-anggota'
import ManajemenPinjaman from './pages/Manajemen-pinjaman/manajemen-pinjaman'
import Notifikasi from './pages/Notifikasi/Notifikasi'


export default function App() {
  const { theme } = useTheme()

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
        position="top-center"
        closeButton={true}
        offset={{
          top: 50
        }}
        
      />
    </HashRouter>
  )
}
