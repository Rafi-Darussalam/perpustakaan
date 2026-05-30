import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

function AppSettingsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Tampilan</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Pilih tema yang nyaman untukmu.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">Mode Tema</span>
          <ModeToggle />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-1">Tentang Aplikasi</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Informasi versi dan sistem.
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Nama Aplikasi</span>
            <span className="font-medium text-foreground">Library Mate</span>
          </div>
          <div className="flex justify-between">
            <span>Versi</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettingsTab({ session }: { session: any }) {
  const [name, setName] = useState(session?.user?.name || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    try {
      setSaving(true)
      await authClient.updateUser({ name: name.trim() })
      toast.success('Profil berhasil diperbarui')
    } catch (error) {
      console.error(error)
      toast.error('Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Informasi Akun</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Kelola informasi profil akunmu.
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Email</span>
            <span className="font-medium text-foreground">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Role</span>
            <span className="font-medium text-foreground capitalize">{session?.user?.role || 'user'}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Ubah Nama</h3>
        <div className="flex flex-col gap-2">
          <Label htmlFor="settings-name" className="text-xs text-muted-foreground">
            Nama Tampilan
          </Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu..."
          />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  )
}

export function SettingsSheet({ isGuest }: { isGuest: boolean }) {
  const { data: session } = authClient.useSession()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <SidebarMenuButton tooltip="Pengaturan" className='mb-4'>
          <Settings className="h-4 w-4" />
          <span>Pengaturan</span>
        </SidebarMenuButton>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4" />
            Pengaturan
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Tabs defaultValue="app" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="app" className="flex-1">Aplikasi</TabsTrigger>
              <TabsTrigger value="profile" className="flex-1" disabled={isGuest}>
                Profil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="app">
              <AppSettingsTab />
            </TabsContent>

            <TabsContent value="profile">
              {!isGuest && session ? (
                <ProfileSettingsTab session={session} />
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center text-sm text-muted-foreground gap-2">
                  <p>Silakan login terlebih dahulu</p>
                  <p className="text-xs">untuk mengakses pengaturan profil.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
