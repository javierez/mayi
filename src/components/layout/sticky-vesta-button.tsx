"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

export function StickyVestaButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sticky Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Vesta"
      >
        <Image
          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vesta-small.png"
          alt="Vesta"
          width={32}
          height={32}
          className="object-contain"
        />
      </button>

      {/* Coming Soon Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xs border-none bg-white/95 backdrop-blur-sm">
          <DialogTitle className="sr-only">Vesta AI</DialogTitle>
          <div className="flex flex-col items-center py-6">
            <Image
              src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vesta-small.png"
              alt="Vesta"
              width={48}
              height={48}
              className="object-contain"
            />
            <p className="mt-4 text-lg font-medium text-gray-700">
              Proximamente...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
