"use client";

import { useState, useEffect } from "react";
import { useSession } from "~/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Upload } from "lucide-react";
import {
  uploadAccountLogoForConfig,
  getAccountSettingsAction,
  getCurrentUserAccountIdAction,
} from "~/app/actions/settings";
import { useToast } from "~/components/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const AccountConfiguration = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [accountId, setAccountId] = useState<bigint | null>(null);

  useEffect(() => {
    async function loadAccountData() {
      if (session?.user?.id) {
        const userAccountId = await getCurrentUserAccountIdAction();
        if (userAccountId) {
          setAccountId(BigInt(userAccountId));
          const settings = await getAccountSettingsAction(
            BigInt(userAccountId),
          );
          if (settings.success && settings.data?.logo) {
            setLogoUrl(settings.data.logo);
          }
        }
      }
    }
    void loadAccountData();
  }, [session]);

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !accountId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const result = await uploadAccountLogoForConfig(formData);

      if (result.success && result.data?.logo) {
        setLogoUrl(result.data.logo);
        toast({
          title: "Logo actualizado",
          description: "El logo se ha actualizado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: result.error ?? "Error al actualizar el logo",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al subir el logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="other">Otras Opciones</TabsTrigger>
        </TabsList>

        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <div className="mb-4">
                  <Label>Logo Actual</Label>
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Logo de la empresa"
                      className="h-32 w-auto rounded border object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="logo-upload">
                  {logoUrl ? "Cambiar Logo" : "Subir Logo"}
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading || !accountId}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || !accountId}
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Subiendo..." : "Seleccionar Imagen"}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Formatos permitidos: PNG, JPG, JPEG. Tamaño máximo: 5MB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                Más opciones de configuración estarán disponibles próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
