import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Sesión iniciada', 'success');
      navigate('/perfil');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="font-display text-3xl font-bold text-ink-950">ADSO</span>
            <span className="font-display text-3xl font-light tracking-widest text-gold-500">Trend</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-ink-950">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-ink-500">Inicia sesión para continuar comprando</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-100 p-8 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Iniciando...' : 'Iniciar sesión'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="font-semibold text-ink-950 underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
