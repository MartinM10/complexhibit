# Guía de Despliegue a Producción - Complexhibit

Esta guía detalla paso a paso cómo desplegar las aplicaciones Backend y Frontend en tu servidor de producción, utilizando el dominio `complexhibit.uma.es` y los certificados SSL proporcionados.

## 1. Preparación Local

Antes de subir nada al servidor, asegúrate de tener los archivos listos.

### 1.1. Certificados SSL
Asegúrate de tener tus archivos de certificado a mano. Según la configuración de `nginx.conf`, se esperan:
- `fullchain.cer` (El certificado público + cadena intermedia)
- `complexhibit_uma_es.key` (La clave privada)

> [!TIP]
> Si tienes los certificados por separado, puedes crear el bundle así:
> `cat complexhibit_uma_es_cert.cer complexhibit_uma_es_interm.cer > fullchain.cer`

### 1.2. Configuración de Variables de Entorno (`.env`)
1. Copia el archivo `.env.template` a `.env` en la raíz del proyecto.
2. Edita `.env` con los valores de producción:

```env
# ... otras variables ...

# Producción: URLs Reales
# La URL pública que el navegador usará para contactar a la API
NEXT_PUBLIC_API_URL=https://complexhibit.uma.es/api/v1

# Rutas internas de Docker (Generalmente no necesitas cambiar esto si usas el docker-compose proporcionado)
API_URL=http://backend:8000/api/v1
FRONTEND_URL=https://complexhibit.uma.es

# Seguridad
JWT_SECRET=GENERAR_UNA_CLAVE_LARGA_Y_SEGURA_AQUI
VIRTUOSO_DBA_PASSWORD=una_contraseña_segura_db
POSTGRES_PASSWORD=una_contraseña_segura_postgres
ADMIN_PASSWORD=una_contraseña_segura_admin
```

> **IMPORTANTE**: `NEXT_PUBLIC_API_URL` se "imprime" dentro del código del frontend durante la construcción. Si cambias esto después, **debes** reconstruir el contenedor del frontend.

### 1.3. Configuración de Virtuoso
Copia la configuración de producción para Virtuoso:
```bash
cp backend/virtuoso.prod.ini backend/virtuoso.ini
```

## 2. Transferencia al Servidor

Necesitas subir el proyecto y los certificados a tu servidor.

### Usando SCP (desde tu terminal local)
Supongamos que tu usuario en el servidor es `ubuntu` y la IP es `1.2.3.4`:

```bash
# 1. Crear carpeta en el servidor
ssh ubuntu@1.2.3.4 "mkdir -p ~/complexhibit/deployment/certs"

# 2. Subir código fuente (excluyendo node_modules, .venv, etc. si tienes un .gitignore limpio, o usa rsync)
# Una forma sencilla es comprimir todo y subirlo, o usar git clone si el repo es privado.
# Si lo tienes local:
scp -r backend frontend deployment docker-compose.yml .env ubuntu@1.2.3.4:~/complexhibit/

# 3. Subir certificados
scp ruta/a/tu/fullchain.cer ubuntu@1.2.3.4:~/complexhibit/deployment/certs/fullchain.cer
scp ruta/a/tu/complexhibit_uma_es.key ubuntu@1.2.3.4:~/complexhibit/deployment/certs/complexhibit_uma_es.key
```

## 3. Configuración en el Servidor

Conéctate via SSH a tu servidor:
```bash
ssh ubuntu@1.2.3.4
cd ~/complexhibit
```

### 3.1. Instalar Docker y Docker Compose
Si el servidor es "virgen", instala Docker:

```bash
# Script oficial de instalación rápida
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dar permisos a tu usuario (para no usar sudo en cada comando docker)
sudo usermod -aG docker $USER
# (Cierra sesión y vuelve a entrar para aplicar cambios)
exit
ssh ubuntu@1.2.3.4
```

### 3.2. Verificar Archivos
Asegurate de que tienes esta estructura en `~/complexhibit`:
```
/complexhibit
├── .env
├── backend/
├── frontend/
└── deployment/
    ├── docker-compose.prod.yml
    ├── nginx.conf
    └── certs/
        ├── fullchain.cer
        └── complexhibit_uma_es.key
```

## 4. Despliegue

Ejecuta el siguiente comando para construir e iniciar los contenedores usando la configuración de producción que hemos creado:

```bash
# Entrar en la carpeta de despliegue para contexto o ejecutar desde raíz apuntando al archivo
cd ~/complexhibit/deployment

# Ejecutar Docker Compose apuntando al archivo prod y usando el contexto de la carpeta superior
# NOTA: El docker-compose.prod.yml asume que está en 'deployment/' y el código en '../'
docker compose -f docker-compose.prod.yml up -d --build
```

**Explicación:**
- `-f docker-compose.prod.yml`: Usa el archivo de configuración de producción (con Nginx).
- `up -d`: Levanta los servicios en segundo plano (`detached`).
- `--build`: Fuerza la reconstrucción de las imágenes (crucial para que el Frontend coja la nueva `NEXT_PUBLIC_API_URL`).

## 5. Verificación

1. **Estado de Contenedores**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   Deberías ver `nginx`, `backend`, `frontend`, `virtuoso`, y `postgres` en estado "Up" o "Running".

2. **Logs (si algo falla)**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

3. **Prueba Web**:
   - Abre `https://complexhibit.uma.es` en tu navegador. Debería cargar el Frontend.
   - Abre `https://complexhibit.uma.es/api/v1/docs` (o el endpoint de health). Debería cargar la documentación de la API.


## 6. Gestión Gráfica (Portainer)

Para gestionar tus contenedores, ver logs y reiniciar servicios desde el navegador (como pediste), hemos incluido **Portainer**.

1. **Acceso**:
   - Abre `http://TU_IP_SERVIDOR:9000` (o `http://complexhibit.uma.es:9000` si el puerto 9000 está abierto).
   - La primera vez te pedirá crear un usuario y contraseña de administrador.

2. **Funcionalidades**:
   - **Ver Logs**: Clic en el contenedor > "Logs". Ideal para ver si el backend falla.
   - **Reiniciar**: Clic en el contenedor > "Restart". Útil tras cambiar variables de entorno.
   - **Consola**: Clic en el botón ">_" (Console) para entrar dentro del contenedor (ej. para ejecutar scripts de base de datos).

## Checklist de Seguridad Final
- [ ] ¿Has cambiado todas las contraseñas en `.env`?
- [ ] ¿`virtuoso.ini` es la versión `.prod.ini`?
- [ ] ¿Los puertos 8000, 3000, 8890, 5432 están cerrados en el firewall del servidor (UFW/AWS Security Groups) para el acceso público?
  - **Solo los puertos 80 y 443 deberían estar abiertos al mundo.**
  - Docker gestiona iptables, pero nuestro `docker-compose.prod.yml` usa `expose` en lugar de `ports` para los servicios internos, lo cual ya los protege de acceso externo directo, excepto Nginx. ¡Buen trabajo!

¡Listo! Tu aplicación está desplegada en producción.
