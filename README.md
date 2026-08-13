# ADSO Trend

Tienda online de moda contemporánea construida con React, TypeScript, Tailwind CSS y Supabase. Diseño premium inspirado en grandes marcas de e-commerce de moda, con paleta negro/blanco/dorado y tipografía editorial.

## Características principales

### Tienda (vista pública)

- **Página principal** con banner "Descubre tu nuevo estilo", productos destacados, tendencias del mes, nuevas colecciones, ofertas y categorías visuales.
- **Catálogo** con buscador inteligente, filtros por precio/talla/color/categoría y ordenamiento (precio, valoración, novedad).
- **Detalle de producto** con galería de imágenes, selección de talla y color, control de cantidad, productos relacionados y sistema de reseñas con calificación de estrellas.
- **Carrito** persistente (guardado en Supabase) con edición de cantidades y cálculo de envío.
- **Checkout** con formulario de envío, método de pago y confirmación de pedido.
- **Autenticación** con registro, login y cierre de sesión (Supabase Auth, email/contraseña).
- **Perfil de usuario** editable con nombre, teléfono y dirección.
- **Historial de pedidos** con estado de cada compra.
- **Favoritos** (lista de deseos) con un clic desde cualquier producto.
- **Recomendador de Estilo**: el usuario elige Urbano, Casual, Elegante o Deportivo y recibe recomendaciones de prendas.
- **Combina tu Outfit**: looks curados con las prendas que componen cada combinación.

### Panel administrativo

- **Dashboard** con ingresos totales, número de pedidos, productos, usuarios, pedidos recientes y productos más vendidos.
- **Gestión de productos**: crear, editar y eliminar productos con imágenes, tallas, colores, stock, etiquetas de estilo y banderas (destacado, nuevo, tendencia).
- **Gestión de categorías**: crear, editar y eliminar categorías.
- **Gestión de pedidos**: ver todos los pedidos y cambiar su estado (pendiente, pagado, enviado, entregado, cancelado).
- **Gestión de usuarios**: listar usuarios y asignar/quitar rol de administrador.
- **Control de inventario**: editar stock por producto con alertas de stock bajo.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Iconos | Lucide React |
| Routing | React Router DOM v6 |
| Backend | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (JWT, email/contraseña) |
| Almacenamiento | Supabase Storage (bucket para imágenes) |

## Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── AdminLayout.tsx      # Layout del panel admin (sidebar + contenido)
│   ├── Footer.tsx            # Pie de página de la tienda
│   ├── Navbar.tsx            # Barra de navegación con buscador y carrito
│   ├── ProductCard.tsx       # Tarjeta de producto con hover y favoritos
│   ├── Rating.tsx            # Sistema de estrellas
│   └── StoreLayout.tsx       # Layout de la tienda (navbar + footer)
├── contexts/            # Proveedores de estado global
│   ├── AuthContext.tsx       # Sesión, perfil, signIn, signUp, signOut
│   ├── CartContext.tsx       # Carrito persistente en Supabase
│   └── ToastContext.tsx      # Notificaciones emergentes
├── lib/
│   └── supabase.ts           # Cliente singleton de Supabase
├── pages/               # Páginas de la aplicación
│   ├── HomePage.tsx          # Página principal
│   ├── CatalogPage.tsx       # Catálogo con filtros
│   ├── ProductDetailPage.tsx # Detalle de producto
│   ├── CartPage.tsx          # Carrito
│   ├── CheckoutPage.tsx      # Finalizar compra
│   ├── LoginPage.tsx         # Inicio de sesión
│   ├── SignupPage.tsx        # Registro
│   ├── ProfilePage.tsx       # Perfil de usuario
│   ├── OrdersPage.tsx        # Historial de pedidos
│   ├── FavoritesPage.tsx    # Lista de deseos
│   ├── StyleQuizPage.tsx    # Recomendador de estilo
│   ├── OutfitsPage.tsx       # Combina tu outfit
│   └── admin/                # Páginas del panel admin
│       ├── AdminDashboard.tsx
│       ├── AdminProducts.tsx
│       ├── AdminCategories.tsx
│       ├── AdminOrders.tsx
│       ├── AdminUsers.tsx
│       └── AdminInventory.tsx
├── types/
│   └── index.ts              # Tipos TypeScript del dominio
├── App.tsx                   # Definición de rutas
├── main.tsx                  # Punto de entrada
└── index.css                 # Estilos globales y sistema de diseño
```

## Base de datos

El esquema incluye 10 tablas con Row Level Security (RLS) habilitado en todas:

| Tabla | Propósito |
|-------|-----------|
| `categories` | Categorías de productos (Hombre, Mujer, Accesorios, etc.) |
| `products` | Catálogo de productos con imágenes, tallas, colores, stock |
| `profiles` | Datos extendidos del usuario (nombre, teléfono, dirección, rol admin) |
| `favorites` | Lista de deseos por usuario |
| `cart_items` | Items del carrito por usuario |
| `orders` | Pedidos realizados con dirección de envío y estado |
| `order_items` | Líneas de cada pedido |
| `reviews` | Reseñas y calificaciones de productos |
| `outfits` | Combinaciones curadas de prendas ("Combina tu outfit") |
| `recently_viewed` | Historial de productos vistos por usuario |

### Políticas de seguridad (RLS)

- **Tablas de catálogo** (`categories`, `products`, `outfits`): lectura pública para usuarios anónimos y autenticados; escritura solo para autenticados (gestión admin).
- **Tablas de usuario** (`profiles`, `favorites`, `cart_items`, `orders`, `order_items`, `recently_viewed`): acceso limitado al propietario mediante `auth.uid()`.
- **Reseñas** (`reviews`): lectura pública; escritura limitada al propietario.
- **Order items**: acceso a través de la propiedad del pedido padre.

## Instalación y ejecución

### Requisitos previos

- Node.js 18 o superior
- npm

### Pasos

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   El archivo `.env` ya viene con las credenciales de Supabase preconfiguradas:

   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

3. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

4. **Compilar para producción:**

   ```bash
   npm run build
   ```

5. **Verificar tipos:**

   ```bash
   npm run typecheck
   ```

## Usuario de prueba

### Administrador

- **Email:** `admin@adsotrend.com`
- **Contraseña:** `admin123456`

Al iniciar sesión con esta cuenta aparece el botón "Admin" en el menú superior, que da acceso al panel administrativo completo.

### Cliente

Puedes crear una cuenta de cliente nueva desde la página de registro (`/signup`). La cuenta de cliente puede:

- Navegar y comprar productos
- Gestionar favoritos
- Ver historial de pedidos
- Editar su perfil y dirección

## Datos de prueba

La base de datos viene precargada con:

- **5 categorías:** Hombre, Mujer, Accesorios, Nueva Colección, Ofertas
- **17 productos** con imágenes reales, tallas, colores, stock, precios y etiquetas de estilo
- **4 outfits** curados (Urbano Nocturno, Elegancia de Oficina, Casual Fin de Semana, Deportivo Street)

## Diseño

### Paleta de colores

- **Negro** (`ink-950`): fondo principal, botones primarios
- **Blanco**: fondo de tarjetas y secciones
- **Gris oscuro** (`ink-700`): texto secundario
- **Dorado** (`gold-500`): acentos, botones destacados, detalles premium

### Tipografía

- **Playfair Display**: títulos y display (serif editorial)
- **Inter**: cuerpo de texto y UI (sans-serif moderna)

### Características visuales

- Hero a pantalla completa con imagen editorial
- Tarjetas de producto con hover (cambio de imagen, aparición de CTA)
- Animaciones suaves (fade-up, shimmer en skeletons)
- Banners promocionales con superposición de imagen
- Diseño totalmente responsive (móvil, tablet, escritorio)
- Micro-interacciones en botones y enlaces

## Licencia

Proyecto educativo desarrollado para fines de aprendizaje.
