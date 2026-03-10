---
name: documentacion_espanol
description: Regla que garantiza que toda la documentación, comentarios de código, mensajes de UI, y artefactos estén escritos en español.
---

# Documentación en Español — Regla de Proyecto

> ⚠️ **Esta regla es OBLIGATORIA para todo el proyecto `fnautos-gestion` y cualquier cliente derivado de esta plantilla.**

## 📋 Qué debe estar en Español

### 1. Código fuente
- **Comentarios de código** (`//`, `/* */`, `/** */`): Siempre en español.
  ```ts
  // ✅ Correcto: Calculamos el IVA sobre la base imponible
  const iva = baseImponible * (ivaPorcentaje / 100)

  // ❌ Incorrecto: Calculate VAT on taxable base
  const iva = baseImponible * (ivaPorcentaje / 100)
  ```
- **Nombres de variables en lógica de negocio**: Español (no en librerías o componentes genéricos).
  ```ts
  // ✅ En acciones de negocio:
  const totalFactura = lineas.reduce(...)
  const clienteActivo = clientes.filter(c => c.activo)

  // Aceptable en componentes genéricos (shadcn, utils):
  const isOpen = useState(false)
  ```
- **Textos de UI**: 100% en español. Sin inglés en botones, etiquetas, mensajes de error, toasts, placeholder.

### 2. Documentación y artefactos
- Todos los archivos en `/plantilla/*.md`: Español.
- Todos los skills en `.agent/skills/*/SKILL.md`: Preferiblemente en español (o bilingüe con español primero).
- Los artefactos de planificación (`task.md`, `implementation_plan.md`, `walkthrough.md`): Español.
- Los `README.md` del proyecto: Español.

### 3. Tasks y Checklists
- Los títulos de tareas: Español.
- Las descripciones de "Definition of Done": Español.
- Los comentarios en commits (opcional, pero recomendado en español).

## ✅ Reglas de aplicación por el agente

Cada vez que el agente:
1. **Escribe un nuevo archivo**: Los comentarios y textos de UI deben ser en español.
2. **Modifica un archivo existente**: Si encuentra comentarios en inglés relacionados con la edición, los traduce.
3. **Crea un artefacto** (task.md, walkthrough.md, etc.): Redactado completamente en español.
4. **Añade mensajes de `toast`**: `toast.success("Guardado correctamente")`, no `toast.success("Saved successfully")`.
5. **Añade mensajes de error**: En español y descriptivos.

## 🚫 Excepciones aceptables

Los siguientes elementos pueden permanecer en inglés sin ser corregidos:
- Nombres de librerías y APIs externas (`NextResponse`, `supabase.from(...)`)
- Palabras técnicas estándar que no tienen traducción natural (`token`, `hook`, `build`, `deploy`, `fetch`)
- Código generado automáticamente por herramientas (scaffolding, tipos de Supabase)
- Atributos HTML estándar (`className`, `onClick`, `onChange`)
- Variables internas de componentes genéricos reutilizables (`isLoading`, `hasError`, `value`)

## 📝 Nota sobre el código existente

El código base puede contener comentarios o variables en inglés de versiones anteriores. No es necesario refactorizar todo el código existente, pero:
- Al tocar un archivo, traduce los comentarios que estén cerca de tu edición.
- No introduzcas nuevos comentarios en inglés.
