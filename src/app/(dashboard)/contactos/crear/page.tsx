import { Suspense } from "react";
import ContactForm from "~/components/contactos/crear/contact-form";

export default function CreateContactPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Cargando...
        </div>
      }
    >
      <ContactForm />
    </Suspense>
  );
}
