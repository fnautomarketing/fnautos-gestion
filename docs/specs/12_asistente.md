# Especificación de Asistente IA (STVLS Copilot)

## Resumen
Funcionalidad de chat integrada que permite a los usuarios interactuar con el sistema utilizando lenguaje natural para consultas, análisis y acciones.

## 1. Interfaz de Chat

### Diseño
-   **Widget Flotante:** Disponible en toda la aplicación (esquina inferior derecha).
-   **Página Dedicada:** `/dashboard/asistente` para conversaciones extendidas.
-   **Historial:** Persistencia de conversaciones recientes.

## 2. Capacidades de Consulta (Lectura)

### Datos Accesibles
-   **Facturas:** "Muéstrame las facturas vencidas de este mes".
-   **Clientes:** "¿Cuál es el cliente con mayor facturación?".
-   **Resúmenes:** "Dame un resumen de ingresos de los últimos 3 meses".
-   **Contexto:** El asistente entiende la página actual (si estás en una factura, "envíala por correo" se refiere a esa factura).

## 3. Capacidades de Acción (Escritura)

### Comandos Naturales
-   "Crea una factura para Cliente X por concepto de Transporte de Mercancías, 500 euros".
-   "Envía un recordatorio de pago a Cliente Y".
-   "Registra un gasto de 30 euros en combustible".

### Confirmación
-   **Siempre** pedir confirmación antes de ejecutar acciones críticas (crear, modificar, borrar, enviar emails).
-   Mostrar tarjeta resumen de la acción propuesta ("Voy a crear esta factura: [Detalles]. ¿Correcto?").

## 4. Análisis Proactivo

### Sugerencias
-   Alertar sobre facturas duplicadas potenciales.
-   Sugerir categorías para gastos basados en el concepto.
-   Alertar sobre clientes en riesgo de impago.

## Verificación

### Pruebas Manuales
-   [ ] Preguntar por facturas vencidas -> Verificar respuesta con datos reales.
-   [ ] Pedir crear un borrador de factura -> Verificar que se crea correctamente en la BD.
-   [ ] Navegar a una factura y preguntar "¿Quién es este cliente?" -> Verificar contexto.
