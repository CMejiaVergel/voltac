# Guía Paso a Paso: Indexación en Google Search Console (Sitemap)

Esta guía te mostrará cómo registrar la web de Voltac Systems en Google y cómo enviarle el archivo `sitemap.xml` para que todos los artículos, proyectos y servicios se indexen automáticamente en el buscador.

## Paso 1: Crear la propiedad en Google Search Console

1. Inicia sesión con la cuenta de Google principal de Voltac Systems (ej. `contacto@voltac.com.co` si está en Workspace, o tu cuenta de Gmail asignada al proyecto).
2. Ve a [Google Search Console](https://search.google.com/search-console).
3. Haz clic en **"Empezar ahora"**.
4. En la pantalla de bienvenida ("Añadir propiedad"), verás dos opciones: **Dominio** y **Prefijo de la URL**.
   - Selecciona **Dominio** (la opción de la izquierda).
   - Escribe `voltac.com.co` y haz clic en **Continuar**.

## Paso 2: Verificar la propiedad mediante DNS (Recomendado)

Dado que usas Nginx y tienes el dominio en un proveedor (como Hostinger o GoDaddy), la forma más limpia de verificar la propiedad es agregando un registro DNS.

1. Google te mostrará un código de verificación TXT (algo como `google-site-verification=...`). Copia ese valor.
2. Abre el panel de control de tu proveedor de dominio donde tienes gestionado `voltac.com.co`.
3. Ve a la zona de **Configuración de DNS**.
4. Crea un nuevo registro con los siguientes datos:
   - **Tipo:** `TXT`
   - **Nombre / Host:** `@` (o déjalo en blanco según el proveedor).
   - **Valor:** *[Pega aquí el código que te dio Google]*
   - **TTL:** Por defecto.
5. Guarda el registro.
6. Vuelve a Google Search Console y haz clic en **Verificar**. 
   *(Nota: Los registros DNS pueden tardar unos minutos en propagarse. Si falla, espera 5-10 minutos e inténtalo de nuevo).*

## Paso 3: Enviar el Sitemap.xml

Una vez dentro de tu panel de Search Console con la propiedad verificada:

1. En el menú lateral izquierdo, bajo la sección **Indexación**, haz clic en **Sitemaps**.
2. Verás un campo que dice "Añadir un sitemap nuevo" con la URL de tu sitio ya pre-cargada (`https://voltac.com.co/`).
3. En la caja de texto, escribe: `sitemap.xml`
4. Haz clic en **Enviar**.

Google procesará el archivo. Te aparecerá un mensaje de confirmación y el estado dirá "Correcto" (puede tardar unos minutos en leer la cantidad de URLs).

## Paso 4: Forzar la indexación inicial (Opcional pero recomendado)

Para acelerar el proceso de aparecer en Google hoy mismo:
1. En la barra de búsqueda superior de Search Console, pega tu URL principal: `https://voltac.com.co/` y presiona Enter.
2. Search Console te dirá "La URL no está en Google" (porque es nueva).
3. Haz clic en **Solicitar indexación**. Esto pone a tu página en la lista de prioridad de los bots de Google.
4. Repite este proceso con tus páginas más importantes (ej. `https://voltac.com.co/servicios` o `https://voltac.com.co/acerca-de`).

---

## Tip de Monitoreo
Vuelve a revisar este panel en 48-72 horas. Podrás ver cuántas de tus páginas fueron añadidas al índice de Google, y si existe algún error de lectura, el panel te avisará exactamente cuál es el problema.
