import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Library, LogIn } from 'lucide-react'
import { useState } from 'react'
import LoginModal from '@/components/LoginModal'

export default function GuestHome() {
  const [loginOpen, setLoginOpen] = useState(false)
  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Selamat Datang di Perpustakaan</h1>
        <p className="text-muted-foreground text-sm">
          Temukan ribuan koleksi buku untuk menambah wawasanmu.
        </p>
      </div>

      {/* Login prompt card */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-5">
            <Library className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Masuk untuk Mengakses Fitur Lengkap</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Login untuk meminjam buku, melihat riwayat peminjaman, memantau batas pengembalian,
              dan masih banyak lagi.
            </p>
          </div>
          <Button onClick={() => setLoginOpen(true)} className="mt-2 gap-2">
            <LogIn className="h-4 w-4" />
            Masuk Sekarang
          </Button>
        </CardContent>
      </Card>

      {/* Feature teaser cards */}
      <div className="flex gap-4 flex-wrap">
        {[
          {
            icon: <BookOpen className="h-5 w-5 text-muted-foreground" />,
            title: 'Koleksi Buku',
            desc: 'Jelajahi ribuan judul buku dari berbagai kategori'
          },
          {
            icon: <Library className="h-5 w-5 text-muted-foreground" />,
            title: 'Peminjaman',
            desc: 'Ajukan peminjaman buku langsung dari aplikasi'
          },
          {
            icon: <LogIn className="h-5 w-5 text-muted-foreground" />,
            title: 'Pantau Status',
            desc: 'Lacak status dan riwayat peminjaman kapan saja'
          }
        ].map((f, i) => (
          <Card key={i} className="flex-1 min-w-[200px] bg-linear-to-b from-background to-sidebar opacity-60">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="rounded-md bg-muted w-fit p-2">{f.icon}</div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
