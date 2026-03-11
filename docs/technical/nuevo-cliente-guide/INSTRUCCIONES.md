# 🚀 Guía de Instalación para Nuevo Cliente (ERP)

Este directorio contiene los archivos necesarios para desplegar el sistema ERP en un nuevo proyecto de Supabase.

## 📁 Contenido del Directorio

1. `1_ESTRUCTURA_MAESTRA.sql`: Crea todas las tablas, vistas, funciones, triggers y políticas de seguridad (RLS).
2. `2_DATOS_INICIALES_PERSONALIZABLE.sql`: Inserta la empresa, serie de facturación y vincula al administrador.

---

## 🛠️ Pasos para un Nuevo Proyecto

### 1. Preparación en Supabase Dashboard
- Crea un nuevo proyecto en Supabase.
- Ve a **Authentication > Users** y crea manualmente el usuario que será el administrador (ej: `admin@cliente.com`).

### 2. Aplicar la Estructura (Schema)
- Abre el archivo `1_ESTRUCTURA_MAESTRA.sql`.
- Copia todo su contenido.
- En Supabase, ve al **SQL Editor**, pega el código y dale a **Run**.

### 3. Personalizar y Aplicar el Seed
- Abre el archivo `2_DATOS_INICIALES_PERSONALIZABLE.sql`.
- **IMPORTANTE**: Edita las variables al principio del script (líneas 20-30):
    - `v_email_admin`: El email que creaste en el paso 1.
    - `v_razon_social`: Nombre legal de la empresa.
    - `v_nif`: CIF/NIF real.
    - `v_prefijo_serie`: Prefijo para facturas (ej: 'ABC').
- Copia el código editado, pégalo en el **SQL Editor** y dale a **Run**.

### 4. Configuración de la App (.env.local)
- Copia el `URL` y la `service_role_key` del nuevo proyecto.
- Actualiza tu archivo `.env.local` con estas credenciales.
- Cambia `NEXT_PUBLIC_CLIENT_ID` por el identificador del nuevo cliente.

---

## 🔒 Notas de Seguridad
- El usuario `info@fnautos.es` (u otro admin) tendrá la misma contraseña que ya usa en Supabase para este proyecto.
- Row Level Security (RLS) está activado de serie para proteger los datos de cada cliente.
