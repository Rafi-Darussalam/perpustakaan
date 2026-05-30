import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' })
})

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' })
})

type LoginSchema = z.infer<typeof loginSchema>
type RegisterSchema = z.infer<typeof registerSchema>

function LoginForm({
  onSwitchToRegister,
  onClose
}: {
  onSwitchToRegister: () => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  async function onSubmit(data: LoginSchema) {
    try {
      await authClient.signIn.email(
        { email: data.email, password: data.password },
        {
          onSuccess: (ctx) => {
            const token = ctx.response.headers.get('set-auth-token')
            if (token) localStorage.setItem('auth_token', token)
            localStorage.removeItem('logout_success')
            // Login success notification removed by request
            navigate('/', { replace: true })
            onClose()
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Email atau password salah')
          }
        }
      )
    } catch {
      toast.error('Gagal terhubung ke server autentikasi')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[1.3rem]">Masuk</DialogTitle>
        <DialogDescription>Masuk ke akun Anda untuk mengakses perpustakaan.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
        <Field aria-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">Alamat Email</FieldLabel>
          <Input
            id="login-email"
            placeholder="nama@contoh.com"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
        </Field>

        <Field aria-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">Kata Sandi</FieldLabel>
          <Input
            id="login-password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
        </Field>

        <div>
          <p className="text-sm text-muted-foreground text-center">
            Belum punya akun?{' '}
            <button
              onClick={onSwitchToRegister}
              type="button"
              className="font-medium text-primary hover:underline transition-all"
            >
              Daftar di sini
            </button>
          </p>
        </div>

        <DialogFooter className="pt-2 flex-col gap-2">
          <div className="flex gap-2 w-full justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Masuk'
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  )
}

function RegisterForm({
  onSwitchToLogin,
  onClose
}: {
  onSwitchToLogin: () => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' }
  })

  async function onSubmit(data: RegisterSchema) {
    try {
      await authClient.signUp.email(
        { name: data.name, email: data.email, password: data.password },
        {
          onSuccess: (ctx) => {
            const token = ctx.response.headers.get('set-auth-token')
            if (token) localStorage.setItem('auth_token', token)
            localStorage.removeItem('logout_success')
            // Registration success notification removed by request
            navigate('/', { replace: true })
            onClose()
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Pendaftaran gagal')
          }
        }
      )
    } catch {
      toast.error('Gagal terhubung ke server autentikasi')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[1.3rem]">Daftar Akun</DialogTitle>
        <DialogDescription>Bergabunglah untuk menikmati akses perpustakaan.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
        <Field aria-invalid={!!errors.name}>
          <FieldLabel htmlFor="reg-name">Nama Lengkap</FieldLabel>
          <Input
            id="reg-name"
            placeholder="Nama Anda"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [{ message: errors.name.message }] : []} />
        </Field>

        <Field aria-invalid={!!errors.email}>
          <FieldLabel htmlFor="reg-email">Alamat Email</FieldLabel>
          <Input
            id="reg-email"
            placeholder="nama@contoh.com"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
        </Field>

        <Field aria-invalid={!!errors.password}>
          <FieldLabel htmlFor="reg-password">Kata Sandi</FieldLabel>
          <Input
            id="reg-password"
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
        </Field>

        <div>
          <p className="text-sm text-muted-foreground text-center">
            Sudah punya akun?{' '}
            <button
              onClick={onSwitchToLogin}
              type="button"
              className="font-medium text-primary hover:underline transition-all"
            >
              Masuk di sini
            </button>
          </p>
        </div>

        <DialogFooter className="pt-2 flex-col gap-2">
          <div className="flex gap-2 w-full justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Daftar'
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  )
}

type LoginModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [view, setView] = useState<'login' | 'register'>('login')

  const handleClose = () => {
    onOpenChange(false)
    setView('login')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <DialogContent className="max-w-md">
        {view === 'login' ? (
          <LoginForm onSwitchToRegister={() => setView('register')} onClose={handleClose} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setView('login')} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
