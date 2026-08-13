import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const navLinks = [
  { label: 'Hombre', to: '/catalogo?categoria=hombre' },
  { label: 'Mujer', to: '/catalogo?categoria=mujer' },
  { label: 'Accesorios', to: '/catalogo?categoria=accesorios' },
  { label: 'Nueva Colección', to: '/catalogo?categoria=nueva-coleccion' },
  { label: 'Ofertas', to: '/catalogo?categoria=ofertas' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, profile, signOut, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink-950 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-white">
        Envío gratis en pedidos superiores a $99 · Devoluciones gratuitas en 30 días
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 shadow-sm backdrop-blur' : 'bg-white'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          {/* Mobile menu */}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6 text-ink-900" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="font-display text-2xl font-bold tracking-tight text-ink-950">
              ADSO
            </span>
            <span className="font-display text-2xl font-light tracking-widest text-gold-500">
              Trend
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-950"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Buscar"
              className="text-ink-700 transition-colors hover:text-ink-950"
            >
              <Search className="h-5 w-5" />
            </button>

            {user ? (
              <Link
                to="/perfil"
                className="hidden items-center gap-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-ink-950 sm:flex"
              >
                <User className="h-5 w-5" />
                <span className="max-w-24 truncate">{profile?.full_name?.split(' ')[0] ?? 'Perfil'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden text-ink-700 transition-colors hover:text-ink-950 sm:block"
                aria-label="Cuenta"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link to="/favoritos" className="text-ink-700 transition-colors hover:text-ink-950" aria-label="Favoritos">
              <Heart className="h-5 w-5" />
            </Link>

            <Link to="/carrito" className="relative text-ink-700 transition-colors hover:text-ink-950" aria-label="Carrito">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-950">
                  {count}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-full bg-ink-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-500 hover:text-ink-950 sm:flex"
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>
        </nav>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-ink-100 bg-white px-4 py-4 lg:px-8">
            <form onSubmit={handleSearch} className="mx-auto flex max-w-3xl items-center gap-3">
              <Search className="h-5 w-5 text-ink-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca prendas, categorías, estilos..."
                className="flex-1 border-none bg-transparent text-lg outline-none placeholder:text-ink-400"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5 text-ink-400" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white p-6 shadow-2xl animate-[slideIn_0.25s_ease-out]">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-xl font-bold text-ink-950">Menú</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <X className="h-6 w-6 text-ink-700" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="my-3 h-px bg-ink-100" />
              <Link
                to="/perfil"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Mi Perfil
              </Link>
              <Link
                to="/favoritos"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Favoritos
              </Link>
              <Link
                to="/estilo"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Recomendador de Estilo
              </Link>
              <Link
                to="/outfits"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Combina tu Outfit
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-ink-950 px-4 py-3 text-base font-semibold text-white"
                >
                  Panel Admin
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="mt-2 rounded-lg px-4 py-3 text-left text-base font-medium text-red-600"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
