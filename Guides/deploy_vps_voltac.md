# Guía de Despliegue en VPS - Voltac Systems

Esta guía está diseñada para realizar el despliegue del aplicativo web de Voltac Systems en un Servidor Privado Virtual (VPS) bajo el dominio `voltac.com.co`.

Como el dominio actualmente está apuntando a la infraestructura de la nube de _Lovable_, esta guía incluye el paso crucial de **realizar la actualización de los registros DNS** para desvincularlo de Lovable y dirigir el tráfico de forma limpia hacia Nginx en tu nuevo VPS.

---

## 1. Conexión Inicial y Preparación de Entorno

Conéctate a tu VPS a través de SSH:
```bash
ssh root@tu_ip_del_vps
```

Asegúrate de tener instalado **Node.js, npm, PM2, Git y Nginx**:
```bash
# Actualizar los paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx y Git si no están instalados
sudo apt install nginx git curl -y

# Instalar PM2 globalmente
npm install -g pm2
```

---

## 2. Desvincular Lovable del Dominio (Actualización DNS)

Actualmente tu dominio `voltac.com.co` está apuntando a los servidores alojados en la nube gestionada por **Lovable**. Para poder servir la nueva página desde tu VPS, es indispensable realizar una actualización en los registros DNS desde el panel de tu proveedor de dominios (GoDaddy, Hostinger, Namecheap, etc.):

1. Inicia sesión en el panel de configuración DNS donde compraste `voltac.com.co`.
2. Busca los **Registros A**. Identifica el registro con nombre/host `@` que actualmente apunta a la IP de Lovable.
3. Edita ese registro A y **cambia el valor hacia la IP pública de tu nuevo VPS**.
4. Haz lo mismo con cualquier registro `CNAME` o `A` asignado para `www` (que apunte hacia `voltac.com.co` o directamente a la IP de tu VPS).

> **Nota importante:** Los cambios en registros DNS sufren de un periodo de propagación que puede tomar desde unos minutos hasta un par de horas. Puedes comprobar a dónde está apuntando tu dominio globalmente mediante sitios como [DNS Checker](https://dnschecker.org/).

---

## 3. Clonar y Construir tu Nuevo Proyecto

Una vez limpios los procesos anteriores, obtenemos nuestra nueva plataforma de GitHub.

```bash
# Navegar al directorio donde suelen alojarse las webs (o tu preferido)
cd /var/www

# Clonar del repositorio
git clone https://github.com/CMejiaVergel/voltac.git voltac-systems

# Ingresar a la carpeta local
cd voltac-systems

# Instalar dependencias
npm install

# Construir el aplicativo de Next.js
npm run build
```

---

## 4. Despliegue Continuo con PM2

Utilizaremos **PM2** para que la app se ejecute de fondo, se reinicie sola si hay errores o si el servidor se reinicia, sobre un puerto que no colisione (por defecto Next.js usa el 3000).

```bash
# Levantar la aplicación con PM2
pm2 start npm --name "voltac-systems" -- run start

# Guardar la lista actual de PM2 e inyectarlo en el inicio del sistema operativo
pm2 save
pm2 startup
```

> **Nota importante para Next.js:** Asegúrate de que el puerto `3000` esté libre o especifica otro en el arranque si vas a mantener ambas apps encendidas a futuro.

---

## 5. Configurar el Proxy Inverso con NGINX

Nginx tomará el tráfico del dominio `voltac.com.co` desde el puerto `80` (HTTP) y lo enrutará localmente hacia tu Next.js en el puerto `3000`. 

Si tu VPS venía con una página por defecto de Apache o Nginx, asegúrate de deshabilitarla primero para liberar el tráfico general:
```bash
# Eliminar la configuración por defecto de Nginx (si existe)
sudo rm /etc/nginx/sites-enabled/default
```

Crea una nueva configuración para tu web de Voltac:
```bash
sudo nano /etc/nginx/sites-available/voltac
```

Pega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name voltac.com.co www.voltac.com.co;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Opcional pero recomendado:
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Guarda (`Ctrl+O`, `Enter`) y sal (`Ctrl+X`).

Habilita la configuración y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/voltac /etc/nginx/sites-enabled/

# Validar que los archivos de Nginx tengan la sintaxis correcta
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 6. Seguridad y SSL (Certificado HTTPS Gratuito)

Implementaremos encriptación con Certbot (Let's Encrypt), lo cual es indispensable para tu marca y panel de administración:

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Solicitar el certificado directamente asociándolo a la config de nginx
sudo certbot --nginx -d voltac.com.co -d www.voltac.com.co
```
Sigue las preguntas en pantalla. Te recomiendo seleccionar **"Redirect"** cuando pregunte si deseas forzar todo el tráfico a HTTPS.

*Para verificar el certificado, ahora puedes dirigirte a tu dominio principal de Voltac.*

---

## ¿Y qué pasa con la App de Lovable? ℹ️

Dado que tu aplicativo de Lovable está alojado en sus propios servidores gestionados (y no en tu VPS personal), seguirá funcionando en el enlace nativo o interno proporcionado por dicha plataforma (usualmente terminan en `.lovable.app` u otro subdominio temporal original).
Al editar los DNS mencionados en el paso 2, simplemente le retiras tu dominio personalizado, pero no se afectarán o alterarán tus datos subyacentes ni existirá ninguna colisión, ya que tu servidor de Lovable y este nuevo VPS están totalmente separados.
