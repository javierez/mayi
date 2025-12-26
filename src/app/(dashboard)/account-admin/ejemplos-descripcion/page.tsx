import { getPropertyDescriptionExamples } from "~/server/queries/property-description-examples";
import EjemplosDescripcionClient from "./ejemplos-client";

export const dynamic = "force-dynamic";

export default async function EjemplosDescripcionPage() {
  const examples = await getPropertyDescriptionExamples();

  return <EjemplosDescripcionClient initialExamples={examples} />;
}
