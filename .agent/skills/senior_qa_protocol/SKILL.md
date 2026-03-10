---
name: senior_qa_protocol
description: Protocolo de QA de nivel senior aplicado en cada modificación de código, basado en mejores prácticas de la industria.
---

# Senior QA Protocol

Este skill define las prácticas que un **QA Senior** aplicaría de forma sistemática en cada cambio de código. **Se activa automáticamente en cada edición**.

## 🧪 Filosofía Senior QA

> "No es suficiente que el código funcione. Debe funcionar correctamente, ser predecible y no romper nada más."

## 1. Análisis de Impacto Antes de Editar

Antes de modificar un archivo, preguntarse:
- ¿Qué otros componentes consumen esta función/prop/tipo?
- ¿Puede este cambio romper algún flujo existente?
- ¿Hay tests que cubran esta funcionalidad?

## 2. Reglas de Testing Activas

### En cada modificación de código:
1. **Verificar regresión visual**: Si cambiaste un componente UI, abre el navegador y verifica que se vea correcto.
2. **Verificar tipado**: Si cambiaste una función, verifica que todos sus consumidores sigan compilando.
3. **Verificar estados de error**: Si modificaste una llamada a API o acción Server, verifica el comportamiento ante error.

### Cuándo ejecutar tests formales:
| Tipo de cambio | Acción |
|---|---|
| Nueva función/utilidad | Test unitario obligatorio |
| Nueva página o formulario | Test E2E con `browser_subagent` |
| Cambio en lógica de negocio (facturas, pagos) | Test de integración |
| Cambio de UI menor | Verificación visual manual |

## 3. Cobertura Mínima por Tipo

- **Acciones Server (`.ts`)**: Test de caso feliz + test de error.
- **Componentes con formulario**: Test de validación + envío correcto.
- **Funciones de cálculo**: Test con valores límite (0, negativos, decimales).
- **Hooks personalizados**: Test de estados y efectos secundarios.

## 4. Reporte de Defectos Interno

Cuando se detecta un bug durante el trabajo:
```
[BUG DETECTADO]
Archivo: src/...
Línea: N
Descripción: ¿Qué falla?
Causa: ¿Por qué falla?
Solución: ¿Cómo se corrige?
```

## 5. Checklist QA Senior por Pull Request / Tarea

- [ ] ¿Los cambios están acotados al mínimo necesario (sin cambios colaterales innecesarios)?
- [ ] ¿Se han añadido/actualizados los tipos TypeScript afectados?
- [ ] ¿El código nuevo es legible y auto-documentado?
- [ ] ¿Se han verificado los flujos críticos afectados?
- [ ] ¿Funciona correctamente en modo oscuro?
- [ ] ¿Funciona correctamente en móvil (responsive)?
- [ ] ¿No se han introducido `console.log` de debug sin eliminar?
- [ ] ¿Todos los textos visibles están en español?

## 6. Prioridad de Bugs

| Severidad | Descripción | Acción |
|---|---|---|
| **P0 Crítico** | App no arranca / pérdida de datos | Detener todo y corregir |
| **P1 Alto** | Flujo principal roto (login, crear factura) | Corregir antes de continuar |
| **P2 Medio** | Feature secundaria rota | Anotar en TASK y corregir pronto |
| **P3 Bajo** | Typo, color incorrecto, texto genérico | Anotar para siguiente ciclo |
