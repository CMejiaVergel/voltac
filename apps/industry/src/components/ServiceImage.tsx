import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Service } from "@/content/services";

/**
 * Fotografía de un servicio.
 *
 * Ocupa el lugar que en Voltac Systems ocupan las escenas animadas. El cambio
 * no es estético: allá se vende un proceso que nadie puede fotografiar —un
 * flujo de trabajo, un modelo que clasifica documentos— y una abstracción lo
 * representa mejor. Aquí se vende trabajo sobre equipos que el cliente tiene
 * enfrente todos los días, y reconocer un transmisor o un gabinete de control
 * en la foto es parte de creer que quien lo ofrece sabe de qué habla.
 *
 * El degradado inferior no es decoración: las tarjetas superponen el icono y
 * el número del servicio sobre la imagen, y sin él quedan ilegibles cuando la
 * foto es clara.
 */
export function ServiceImage({
  service,
  className,
  priority = false,
  children,
}: {
  service: Service;
  className?: string;
  /** Solo para la primera imagen visible; el resto carga bajo demanda. */
  priority?: boolean;
  /** Contenido superpuesto (icono, número). */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] overflow-hidden rounded-xl bg-muted border border-border/60",
        className,
      )}
    >
      <Image
        src={service.image}
        alt={service.imageAlt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 380px"
        priority={priority}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-secondary/45 via-transparent to-secondary/20"
      />
      {children}
    </div>
  );
}
