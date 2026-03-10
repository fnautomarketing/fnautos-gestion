# Plantilla ERP — Multi-Cliente

Este directorio documenta el proceso de conversión del proyecto en un **template reutilizable** para diferentes clientes.

## Estado de las tareas

| Tarea | Estado |
|---|---|
| [TASK_01: Configuración & Branding](./TASK_01_CONFIGURACION_BRANDING.md) | ✅ Completada |
| [TASK_02: Adaptación UI Single-Empresa](./TASK_02_ADAPTACION_UI.md) | ✅ Completada |
| [TASK_03: Supabase & Semillas](./TASK_03_SUPABASE_ESTRATEGIA.md) | 🔄 En progreso |
| [TASK_04: Variables de Entorno y Deploy](./TASK_04_VARIABLES_ENTORNO.md) | 🔄 En progreso |

## Para desplegar un nuevo cliente

👉 Lee la **[Guía de Nuevo Cliente](./GUIA_NUEVO_CLIENTE.md)** — proceso completo de 7 pasos.

## Estructura del config por cliente

Cada cliente tiene su propio archivo en `src/config/clients/`:

```
src/config/clients/
  index.ts      ← registro central (modificar para añadir clientes)
  types.ts      ← interface ClientConfig (no tocar)
  stvls.ts      ← cliente STVLS (referencia original)
  fnautos.ts    ← cliente FNAUTOS
```

## Variables de entorno

Plantilla limpia: `.env.example` en la raíz del proyecto.

```bash
cp .env.example .env.local
# Editar .env.local con los valores del proyecto Supabase del nuevo cliente
```
