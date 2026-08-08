# Guía de Gestión Multimedia y Compresión en Voltac Energy

Esta guía documenta el flujo de arquitectura diseñado en el entorno de Next.js (App Router) para manejar archivos pesados (mayores al límite por defecto de 1MB), cómo se realiza la compresión optimizada automatizada, y de qué forma se despachan las imágenes al cliente logrando rendimiento y caché en el servidor VPS.

## 1. Rompiendo el Límite de Subida (1MB -> 50MB)

Por seguridad, las *Server Actions* de Next.js restringen nativamente el envío de datos a 1MB. Dado que los administradores suben fotos originales de alta resolución de proyectos y paneles, se amplió la directiva de memoria.

Esta modificación reside en el archivo `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Permite procesar peticiones con imágenes de hasta 50MB
    },
  },
};
```
*También se declara `sharp` como paquete externo del servidor para que el empaquetador (Webpack) de Next.js no genere conflictos con los binarios de compresión al momento de hacer el `npm run build`.*

---

## 2. Recepción y Compresión de Imágenes con Sharp

La lógica centralizada se lleva a cabo dentro de `src/app/admin/proyectos/actions.ts` (aplica de forma similar para noticias u otros módulos). Cuando el panel de administración envía un formulario con una foto, la función `compressAndSave` intercepta el `File` (ArrayBuffer).

Para lograr un ahorro inmenso de espacio en el disco de la VPS sin sacrificar la visión estética:

1. **Transformación Inmediata con `sharp`**:
   - Todo archivo (sea PNG, BMP, JPEG pesado) se somete a compresión antes de tocar el disco duro.
   - **Resize Activo**: La resolución de ancho máximo se restringe a **1920px**, asegurando nitidez para pantallas desktop grandes, pero sin conservar el exagerado tamaño de 4K u 8K de las cámaras originales (`withoutEnlargement: true` previene escalar imágenes pequeñas).
   - **Formato Homogeneizado (`JPEG progresivo`)**: Se guarda y convierte siempre a `.jpg`. Se establece la `quality` en 80%, y al usar carga `progressive: true`, la imagen se devela desde borroso hacia nítido según la red del cliente (mejorando la percepción visual de carga).

2. **Almacenamiento Local Constante**:
   - Las fotos comprimidas se enrutan finalmente a través del método `writeFile` de la librería nativa de Node (`fs/promises`) y caen estandarizadas en tu carpeta raíz de servidor `/uploads/projects/`.

---

## 3. Servir Imágenes Vía "API Route" de Alto Rendimiento

Dado que las fotos son guardadas como "Assets Dinámicos" generados en tiempo real (en `/uploads`), Next.js no es capaz de leerlos desde su ruta pública convencional (`/public`). En servidores auto-hospedados (VPS, como es tu caso), la solución diseñada es despacharlos a través de tu propia API.

Este proceso sucede en el archivo **Catch-all Route Handler**: `src/app/api/uploads/[...path]/route.ts`.

Funciona de la siguiente forma:
- Cuando la base de datos retorna en el front la imagen del proyecto como `/api/uploads/projects/foto_ejemplo.jpg`, esta ruta intercepta la petición.
- Ubica de manera segura (`process.cwd() + '/uploads/...'`) el archivo en el nivel del sistema Linux de tu VPS.
- Extrae la extensión para inferir el formato (ej. `image/jpeg`).
- **Magia del Caché**: Retorna el búfer de la imagen al navegador añadiendo un cabezal de caché súper agresivo: 
  `"Cache-Control": "public, max-age=31536000, immutable"`
  *Esto significa que la primera vez que un cliente descarga una foto de tus proyectos, su navegador la guarda en disco internamente hasta por 1 año. Si vuelve a entrar o si cambia de página a otro proyecto que usa elementos compartidos, la carga final es "0 ms".*

---

### Resumen del Flujo 🔄
1. Interfaz **Front-End Admin**: Selecciona foto (10MB).
2. **Next Config**: Otorga permiso de peso (>1MB).
3. **Server Action (Sharp)**: Recibe el buffer, recorta ancho a 1920px, comprime JPEG (80% calidad), y la guarda como ~300KB.
4. **Base de Datos**: Recibe la ruta virtual (`/api/uploads/projects/foto1.jpg`).
5. **Cliente (Ruta API)**: Carga en pantalla con cache-control persistente.
