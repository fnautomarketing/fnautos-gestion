# ERP Gestión Multi-Cliente

Sistema integral de gestión de facturación, clientes y pagos con arquitectura multi-empresa (White-Label) y branding dinámico.

## 🚀 Tecnologías Principales

- **Frontend**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes**: [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Base de Datos & Auth**: [Supabase](https://supabase.com/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **PDFs**: [React-PDF](https://react-pdf.org/)

## 📂 Estructura del Proyecto

- `src/app`: Rutas principales y lógica de la aplicación.
- `src/components`: Componentes de interfaz reutilizables.
- `src/config/clients`: Configuraciones de branding y lógica multi-cliente.
- `src/lib`: Utilidades, clientes de Supabase y hooks compartidos.
- `public`: Activos estáticos, logos y favicons.

## ⚙️ Configuración y Despliegue

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Variables de Entorno**:
   Configura un archivo `.env.local` con las credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Build de producción**:
   ```bash
   npm run build
   ```

---
Este proyecto ha sido optimizado para ser una plantilla profesional, segura y altamente escalable.
