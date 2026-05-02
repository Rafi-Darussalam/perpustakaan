import { HashRouter, Routes, Route } from 'react-router-dom'
import { SidebarApp } from '@/components/app/sidebar'
import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-provider'

import Home from './pages/Home/Home'
import ManajemenBuku from './pages/Manajemen-buku/manajemen-buku'
import ManajemenAnggota from './pages/Manajemen-anggota/manajemen-anggota'


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
