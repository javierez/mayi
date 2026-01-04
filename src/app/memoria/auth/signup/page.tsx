"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signIn } from "~/lib/auth-client";

export default function MemoriaSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.firstName,
          firstName: formData.firstName,
        }),
      });

      const result = await response.json() as {
        error?: { message?: string };
        message?: string;
        user?: { id: string };
      };

      if (!response.ok || result.error) {
        setError(result.error?.message ?? result.message ?? "Error al crear la cuenta");
        return;
      }

      // Redirect after signup
      router.push("/memoria");
      router.refresh();
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/memoria",
      });
    } catch (err) {
      setError("Error al registrarse con Google");
      console.error("Google sign up error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50/50 to-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-medium text-gray-800">Crear cuenta</h1>
            <p className="text-sm text-gray-500">
              Empieza a guardar vuestros recuerdos
            </p>
          </div>

          {/* Google Sign Up - Bento style */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-200/80 p-4 transition-colors hover:bg-slate-300/80 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Continuar con Google</span>
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-b from-slate-50/50 to-white px-3 text-xs text-gray-400">
                o con email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs text-gray-500">
                Nombre
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Tu nombre"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                required
                className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:border-slate-300 focus:ring-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-gray-500">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required
                className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:border-slate-300 focus:ring-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-gray-500">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
                className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:border-slate-300 focus:ring-slate-300"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-800 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear cuenta"
              )}
            </motion.button>
          </form>

          {/* Links */}
          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/memoria/auth/signin"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
