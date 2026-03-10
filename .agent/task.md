# Tarea: Verificación de Visión Global y Ciclo de Vida de Facturas

- [x] **Verificación y Recuperación del Servidor**
    - [x] Verificar estado de `localhost:3000`
    - [x] Reiniciar servidor si es necesario (`npm run dev`)
- [x] **Verificación Inicial de Visión Global**
    - [x] Verificar que el selector "Todas las Empresas" funciona
    - [x] Confirmar agregación de datos (Facturación > 0)

## Step 4: Facturación (Invoicing)
- [x] Analyze Invoice creation flow and form components <!-- id: 13 -->
- [x] Analyze Invoice series selection and auto-numbering <!-- id: 14 -->
- [x] Analyze Invoice actions (save, finalize, PDF generation) <!-- id: 15 -->
- [x] Create manual testing step 4 documentation (`STEP_4_TESTING.md`) <!-- id: 16 -->
- [x] Provide the plan to the user <!-- id: 17 -->

- [x] **Simulación de Ciclo de Vida (SQL/Navegador)**
    - [x] **Empresa A (JR Consulting)**: Crear y Pagar Factura (Simulado vía SQL: `TEST-JR-002`, 1000€)
    - [x] **Empresa B (ER Tech)**: Crear y Pagar Factura (Simulado vía SQL: `TEST-ER-001`, 500€)
    - [x] **Prueba de Eliminación**: Verificar capacidad de borrado
- [ ] **Corrección de Visibilidad (BLOQUEADO)**
    - [ ] Aplicar migración de RLS y SECURITY DEFINER
- [ ] **Verificación Final**
    - [ ] **Dashboard**: Verificar que la Facturación Total incluya las nuevas facturas
    - [ ] **Listado de Facturas**: Confirmar presencia de `TEST-JR-002` y `TEST-ER-001`
    - [ ] **Estado**: Confirmar que ambas están como "Pagada"
- [ ] **Documentación**
    - [ ] Actualizar `walkthrough.md` con los resultados de las pruebas

## Phase 3: WhatsApp Requirements
- [ ] **[TASK_10] Configuración y Datos**
    - [ ] Actualizar datos empresas
    - [ ] Configurar IRPF (-1% Edison)
    - [ ] Usuario Admin Global
    - [ ] Testing Chrome DevTools: Validar cálculos IRPF
- [ ] **[TASK_07] Facturas Externas**
    - [ ] Backend: Update table & triggers
    - [ ] Frontend: UI changes (Switch, File Upload)
    - [ ] Testing Chrome DevTools: Upload & Manual Number
- [ ] **[TASK_09] UI y Filtros**
    - [ ] Ocultar vencimiento
    - [ ] Filtros avanzados (Mes, Año, Empresa)
    - [ ] Nueva Serie "FAC"
    - [ ] Testing Chrome DevTools: Filter Performance
- [ ] **[TASK_08] Envío de Emails**
    - [ ] Configurar Resend (Pending API Key)
    - [ ] Modal de envío en frontend
    - [ ] Testing Chrome DevTools: Modal interaction
- [ ] **[TASK_11] Revisión de Pagos**
    - [ ] Auditoría de flujo de pagos
    - [ ] Testing Chrome DevTools: Network analysis
