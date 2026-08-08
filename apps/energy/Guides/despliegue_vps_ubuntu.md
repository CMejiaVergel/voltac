# Guía de Despliegue en VPS (Ubuntu)

Esta guía detalla el paso a paso para desplegar la página web corporativa de **Voltac Energy** (desarrollada en Next.js) en un servidor Virtual Private Server (VPS) ejecutando Ubuntu.

## Requisitos previos

- Un VPS con Ubuntu (versión 20.04 o superior recomendada).
- Acceso SSH al servidor (usuario `root` o usuario con privilegios `sudo`).
- Acceso a Hostinger para gestionar los DNS de tu dominio `voltac.com.co`.
- Tu repositorio de GitHub listo: `https://github.com/CMejiaVergel/voltac-energy.git`

---

## 1. Configuración de DNS en Hostinger (Subdominio)

Antes de conectar tu servidor y preparar el entorno, vamos a enlazar el subdominio a tu VPS:

1. Ingresa a tu panel de **Hostinger** y ve al apartado de **Dominios**.
2. Selecciona tu dominio (presuntamente `voltac.com.co`) y abre el **Editor de Zona DNS**.
3. Añade un nuevo **Registro A** con la siguiente información:
    - **Tipo**: `A`
    - **Nombre**: `energy`
    - **Apunta a**: `IP_DE_TU_VPS` (Escribe la dirección IP pública de Ubuntu).
    - **TTL**: Déjalo por defecto (ej. 14400 o el predefinido).
4. Dale a guardar. (Ten en cuenta que apuntar un dominio nuevo puede tardar en expandirse desde unos pocos minutos hasta 24 horas, pero normalmente es muy rápido).

---

## 2. Conexión al servidor y actualización

Conéctate a tu servidor a través de la terminal usando SSH:

```bash
ssh tu_usuario@ip_de_tu_servidor
```

Una vez dentro, actualiza la lista de paquetes del sistema operativo:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3. Instalación de Node.js y NPM

Next.js requiere Node.js. Instalaremos la versión recomendada (LTS) usando NodeSource.

```bash
# 1. Descargar e instalar el script de configuración de NodeSource (versión 20 LTS como ejemplo)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Instalar Node.js y npm
sudo apt install -y nodejs

# 3. Verificar instalación
node -v
npm -v
```

---

## 4. Clonar el repositorio y configurar el proyecto

Vamos a descargar el código del sistema instalado en nuestro VPS mediante Git.

```bash
# 1. Asegúrate de tener Git instalado
sudo apt install -y git

# 2. Ve a la carpeta donde alojarás el proyecto (generalmente /var/www)
cd /var/www

# 3. Clona el repositorio
sudo git clone https://github.com/CMejiaVergel/voltac-energy.git

# 4. Entra al directorio del proyecto y dale permisos a tu usuario actual
sudo chown -R $USER:$USER voltac-energy
cd voltac-energy

# 5. Instala las dependencias del proyecto
npm install
```

---

## 5. Construcción (Build) de la aplicación

Dado que es un proyecto de Next.js, se debe compilar el código para producción.

Si utilizaste variables de entorno (como accesos a Supabase), asegúrate de crear el archivo `.env.local` o `.env` en el directorio raíz usando `nano .env.local` y añadiéndolas allí antes del *build*.

```bash
# Ejecutar compilación de Next.js
npm run build
```

Esto creará la carpeta `.next` con el código optimizado.

---

## 6. Mantener la aplicación viva: Instalar y configurar PM2

PM2 es un gestor de procesos que nos asegurará que Next.js se ejecute continuamente en segundo plano y se reinicie automáticamente si ocurre un error o si elVPS se reinicia.

```bash
# 1. Instalar PM2 de forma global
sudo npm install -g pm2

# 2. Iniciar el servidor Next.js usando PM2
pm2 start npm --name "voltac-energy" -- run start

# 3. Guardar el estado actual para que inicie después de un reinicio del sistema
pm2 save

# 4. Configurar PM2 para ejecutarse al arrancar el servidor
pm2 startup
# (Ejecuta el comando que PM2 te genere e imprima en la terminal después de correr 'pm2 startup')
```

Tu aplicación Next.js ahora debe estar corriendo en `http://localhost:3000` de manera persistente en tu VPS.

---

## 7. Configuración de Nginx (Reverse Proxy)

Dado que Next.js corre por defecto en el puerto 3000, instalaremos Nginx para interceptar el tráfico web del puerto 80 (HTTP) y enviarlo al puerto 3000, además de enlazarlo a tu subdominio de Hostinger `energy.voltac.com.co`.

```bash
# 1. Instalar Nginx
sudo apt install -y nginx

# 2. Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Crea un archivo de configuración para tu sitio e inserta la redirección del subdominio.

```bash
sudo nano /etc/nginx/sites-available/voltac-energy
```

Pega la siguiente configuración dentro (asegúrate de **NO copiar las comillas invertidas ````nginx`** ni el bloque superior de texto, solo el contenido interior):

```nginx
server {
    listen 80;
    server_name energy.voltac.com.co; # Redirecciona usando tu subdominio de Hostinger

    location / {
        proxy_pass http://localhost:3000; # Redirige el tráfico hacia el puerto de Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guarda el archivo (`Ctrl+O`, `Enter`, `Ctrl+X`). Ahora actívalo enlanzádolo a la carpeta activa:

```bash
# 1. Eliminar la configuración por defecto de Nginx PRIMERO para evitar conflictos con el puerto 80 y la prioridad
sudo rm /etc/nginx/sites-enabled/default

# 2. Habilitar TU configuración (usando -sf para reemplazar si hubiera algo malo enganchado previamente)
sudo ln -sf /etc/nginx/sites-available/voltac-energy /etc/nginx/sites-enabled/

# 3. Verificar RIGUROSAMENTE que no haya errores de sintaxis o de formato (NO TE SALTES ESTE PASO)
sudo nginx -t

# 4. Una vez la terminal te indique "syntax is ok" y "test is successful", Reinicia Nginx
sudo systemctl restart nginx
```

> **⚠️ Atención a errores `ERR_CONNECTION_REFUSED` o pantallas vacías:** Si tu página arroja que "rechazó la conexión" tras ejecutar esto, significa que **Nginx se apagó porque tu archivo falló la prueba de sintaxis** (o dejaste el bloque default activo). Repite `sudo nginx -t` para ver en qué línea falló tu archivo `voltac-energy`, corrige el archivo con `nano` y vuelve a intentarlo. Nginx NUNCA levantará si la prueba de sintaxis indica [emerg]. Si ves "Address already in use", mata el proceso ejecutando `sudo fuser -k 80/tcp` o deteniendo Apache (`sudo systemctl stop apache2`).

Ahora deberías poder ver la web introduciendo `http://energy.voltac.com.co` en el navegador (si los DNS de Hostinger ya se propagaron completamente).

---

## 8. Proteger con Certificado SSL (HTTPS) - Obligatorio para Producción

Para que tu sitio use conexión cifrada `https://` y mostrar la seguridad ante clientes corporativos, utiliza el certificado gratuito de Let's Encrypt mediante Certbot.

```bash
# 1. Instalar Certbot y su extensión para Nginx
sudo apt install -y certbot python3-certbot-nginx

# 2. Ejecutar Certbot e instalar SSL solo para tu subdominio (sigue los pasos en pantalla)
sudo certbot --nginx -d energy.voltac.com.co
```

Certbot actualizará tu configuración de Nginx (`/etc/nginx/sites-available/voltac-energy`) para redirigir forzosamente el tráfico hacia HTTPS. Además, renueva el certificado solito cada 90 días.

---

## 🎉 ¡Felicidades!
La plataforma digital de **Voltac Energy** está desplegada en modo producción lista para interactuar con tus clientes.
