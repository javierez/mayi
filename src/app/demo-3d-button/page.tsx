"use client";

import { Vesta3DButton } from "~/components/ui/vesta-3d-button";

export default function Demo3DButtonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">
            Vesta 3D Button Gallery
          </h1>
          <p className="text-lg text-white/60">
            Interactive Three.js powered buttons with dynamic lighting
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {/* Primary Variant */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Primary Variant
            </h2>
            <Vesta3DButton
              text="Vesta Image Studio"
              variant="primary"
              onClick={() => alert("Primary button clicked!")}
            />
            <p className="text-sm text-white/50">
              Features: Indigo gradient, metallic finish, animated lighting
            </p>
          </div>

          {/* Secondary Variant */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Secondary Variant
            </h2>
            <Vesta3DButton
              text="Create Magic"
              variant="secondary"
              onClick={() => alert("Secondary button clicked!")}
            />
            <p className="text-sm text-white/50">
              Features: Purple gradient, high metalness, dynamic reflections
            </p>
          </div>

          {/* Glass Variant */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Glass Variant</h2>
            <Vesta3DButton
              text="Transform Images"
              variant="glass"
              onClick={() => alert("Glass button clicked!")}
            />
            <p className="text-sm text-white/50">
              Features: Glassmorphic effect, transparency, backdrop blur
            </p>
          </div>

          {/* Custom Text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Custom Text</h2>
            <Vesta3DButton
              text="Start Your Journey"
              variant="primary"
              onClick={() => alert("Custom button clicked!")}
            />
            <p className="text-sm text-white/50">
              Features: Customizable text, hover scale effects, press feedback
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-3xl font-bold text-white">Key Features</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <h3 className="font-semibold text-white">Dynamic Lighting</h3>
              </div>
              <p className="text-sm text-white/60">
                Multi-point light system with animated positions creating
                realistic illumination
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <h3 className="font-semibold text-white">Smooth Animations</h3>
              </div>
              <p className="text-sm text-white/60">
                Gentle rotations, hover effects, and press feedback with lerp
                interpolation
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                <h3 className="font-semibold text-white">
                  Material Variants
                </h3>
              </div>
              <p className="text-sm text-white/60">
                Choose from metallic, glass, or standard finishes with unique
                properties
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <h3 className="font-semibold text-white">Edge Glow</h3>
              </div>
              <p className="text-sm text-white/60">
                Subtle edge highlighting for enhanced depth perception
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <h3 className="font-semibold text-white">Responsive</h3>
              </div>
              <p className="text-sm text-white/60">
                Adapts to container size with proper aspect ratio handling
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <h3 className="font-semibold text-white">
                  Interaction States
                </h3>
              </div>
              <p className="text-sm text-white/60">
                Hover, press, and idle states with smooth transitions
              </p>
            </div>
          </div>
        </div>

        {/* Usage Code */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-8 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Usage Example
          </h2>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white">
            <code>{`import { Vesta3DButton } from "~/components/ui/vesta-3d-button";

export default function MyPage() {
  return (
    <Vesta3DButton
      text="Vesta Image Studio"
      variant="primary"
      onClick={() => console.log("Clicked!")}
      className="w-full"
    />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
