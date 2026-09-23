# Logos de la banda de marcas (home)

Los archivos de esta carpeta alimentan el carrusel de marcas del home
(`src/components/PartnersMarquee.tsx`, lista en `src/content/partners.ts`).

## Archivos pendientes

Estas marcas no existen en ninguna librería de iconos, así que hay que ponerlas
aquí como archivo. Mientras el archivo no exista, la marca simplemente **no se
muestra** en el carrusel — no se ve rota:

| Archivo esperado                     | Marca                              |
| ------------------------------------ | ---------------------------------- |
| `ecopetrol.svg`                      | Ecopetrol                          |
| `cabot.svg`                          | Cabot Corporation                  |
| `camara-comercio-cartagena.svg`      | Cámara de Comercio de Cartagena    |
| `ixl-center.svg`                     | IXL Center                         |
| `econova.svg`                        | Econova                            |

## Requisitos del archivo

- **SVG** preferiblemente (PNG con fondo transparente también sirve; si se usa
  PNG hay que cambiar la extensión en `src/content/partners.ts`).
- **Fondo transparente**, sin recuadro ni márgenes.
- Marca en **un solo color** o en negro: el carrusel aplica `brightness-0 invert`
  para pintarla en blanco sobre el fondo oscuro. Un logo multicolor se verá
  igualmente blanco.
- Proporción horizontal (wordmark), altura de render ~36–44 px.

Siemens, Rockwell Automation, Schneider Electric, Claude, OpenAI y NVIDIA ya se
pintan desde `react-icons` y no necesitan archivo.
