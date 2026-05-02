import FormAddAnggota from "./FormAddAnggota"

type ManajemenAnggotaTitleProps = {
  onSuccess: () => void
}

export default function ManajemenAnggotaTitle({ onSuccess }: ManajemenAnggotaTitleProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Anggota</h1>
        <p className="text-muted-foreground">Kelola semua data anggota tetap perpustakaan.</p>
      </div>
      <div>
        <FormAddAnggota onSuccess={onSuccess} />
      </div>
    </div>
  )
}
