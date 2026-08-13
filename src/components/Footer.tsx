import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-1">
              <span className="font-display text-2xl font-bold">ADSO</span>
              <span className="font-display text-2xl font-light tracking-widest text-gold-500">Trend</span>
            </div>
            <p className="text-sm leading-relaxed text-ink-300">
              Moda contemporánea para la nueva generación. Descubre tu estilo, define tu tendencia.
            </p>
            <div className="mt-6 flex gap-4">
              {[Instagram, Facebook, Twitter, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-gold-500 hover:text-ink-950"
                  aria-label="Red social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">Tienda</h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link to="/catalogo?categoria=hombre" className="hover:text-white">Hombre</Link></li>
              <li><Link to="/catalogo?categoria=mujer" className="hover:text-white">Mujer</Link></li>
              <li><Link to="/catalogo?categoria=accesorios" className="hover:text-white">Accesorios</Link></li>
              <li><Link to="/catalogo?categoria=nueva-coleccion" className="hover:text-white">Nueva Colección</Link></li>
              <li><Link to="/catalogo?categoria=ofertas" className="hover:text-white">Ofertas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">Ayuda</h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><a href="#" className="hover:text-white">Envíos y devoluciones</a></li>
              <li><a href="#" className="hover:text-white">Guía de tallas</a></li>
              <li><a href="#" className="hover:text-white">Métodos de pago</a></li>
              <li><a href="#" className="hover:text-white">Preguntas frecuentes</a></li>
              <li><a href="#" className="hover:text-white">Contáctanos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-500">Newsletter</h4>
            <p className="mb-4 text-sm text-ink-300">Suscríbete y recibe un 10% en tu primera compra.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-ink-400 focus:ring-gold-500"
              />
              <button className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400">
                Unirse
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-ink-400 md:flex-row">
          <p>© 2026 ADSO Trend. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacidad</a>
            <a href="#" className="hover:text-white">Términos</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
