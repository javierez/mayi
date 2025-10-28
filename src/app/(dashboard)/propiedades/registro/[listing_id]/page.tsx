"use client";

import { use } from "react";
import QuickRegistrationForm from "~/components/propiedades/registro/forms/quick-registration-form";

export default function PropertyRegistrationPage({
  params,
}: {
  params: Promise<{ listing_id: string }>;
}) {
  const { listing_id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <QuickRegistrationForm listingId={listing_id} />
    </div>
  );
}
