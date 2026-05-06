import AddPeminjaman from "./FormAddPeminjaman"

type ManajemenPinjamanTitleProps = {
  onSuccess: () => void
}

export default function ManajemenPinjamanTitle({ onSuccess }: ManajemenPinjamanTitleProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Peminjaman</h1>
        <p className="text-muted-foreground">Kelola peminjaman dan pengembalian buku.</p>
      </div>
      <div>
        <AddPeminjaman onSuccess={onSuccess} />
      </div>
    </div>
  )
}
