# Task 10: Configuración de Datos Maestros

## Objetivo
Actualizar la información de las empresas del grupo y habilitar el acceso a la cuenta de administración central.

## Requisitos Funcionales
1. **Datos de Empresa**:
   - Completar información para las 3 empresas (dirección, CIF, email obligatorio).
   - **IRPF**: Configurar la retención por defecto:
     - Edison: **-1%** (Validar que el cálculo de retención acepta negativos).
     - Jennifer: 0% (Sin IRPF).
     - STVLS: 0% (Sin IRPF).

2. **Acceso Administración**:
   - Crear usuario `administracion@stvls.com` en Supabase Auth.
   - Asignar rol `admin_global` (o similar) para que tenga acceso a todas las empresas.
   - Habilitar login en la aplicación.

## Checklist de Implementación
- [ ] Backend: Actualizar tabla `empresas` con los nuevos datos.
- [ ] Backend: Script o comando SQL para crear el usuario de administración.
- [ ] Backend: Verificar permisos RLS para que este usuario vea todas las empresas.
- [ ] **Testing IRPF**: Crear factura de prueba para Edison y verificar que la "Retención" se suma (si es negativo) o resta correctamente.
- [ ] Verificación: Login exitoso con la nueva cuenta y ver datos de las 3 empresas.

## Plan de Pruebas (Chrome DevTools Expert)
- [ ] **Application**: Verificar cookies y sesión tras el login de `administracion@stvls.com`.
- [ ] **Network**: Inspeccionar payload de creación de factura para confirmar que el IRPF negativo se envía correctamente.
- [ ] **Console**: Verificar ausencia de warnings al calcular totales con valores negativos.
