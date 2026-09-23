import { redirect } from 'next/navigation';

export default function ContactoRedirect() {
  // En Voltac Systems, "Contacto" se redirige lógicamente a "Cotizar" donde se capturan los leads.
  // o se puede centralizar en una sola Landing Page de conversión.
  redirect('/cotizar');
}
