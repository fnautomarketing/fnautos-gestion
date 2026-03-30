---
description: Procedimiento rápido para actualizar Antigravity en Linux (Ubuntu/Debian) usando el repositorio oficial.
---

// turbo-all
# Guía de Actualización de Antigravity

Sigue estos pasos para actualizar Antigravity a la última versión estable sin necesidad de búsqueda manual.

### 1. Asegurar el directorio de llaveros
Crea el directorio si no existe:
```bash
sudo mkdir -p /etc/apt/keyrings
```

### 2. Descargar y añadir la clave GPG oficial
Esta clave permite verificar la autenticidad de los paquetes:
```bash
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
```

### 3. Configurar el repositorio en la lista de fuentes
Añade el repositorio de Antigravity a `/etc/apt/sources.list.d/`:
```bash
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null
```

### 4. Actualizar e instalar la última versión
Actualiza los índices de paquetes y descarga la última versión de Antigravity:
```bash
sudo apt update && sudo apt install antigravity -y
```

### 5. Verificar la instalación
Comprueba que la versión se ha actualizado correctamente:
```bash
dpkg -l | grep antigravity
```

> [!NOTE]
> Si se solicita contraseña de sudo, pídela al usuario o usa la almacenada en el contexto anterior si es seguro.
