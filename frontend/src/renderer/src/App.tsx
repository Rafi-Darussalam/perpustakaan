import { HashRouter, Routes, Route } from 'react-router-dom'
import { SidebarApp } from '@/components/app/sidebar'

import Home from './pages/Home/Home'
import ManajemenBuku from './pages/Manajemen-buku/manajemen-buku'

export default function App() {
  return (
    <HashRouter>
      <div>  
        <SidebarApp>
          <Routes>
            <Route index element={<Home />} />
            <Route path='/manajemen-buku' element={<ManajemenBuku />} />
          </Routes>
          </SidebarApp>
      </div>
    </HashRouter>
  )
}
