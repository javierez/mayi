"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Handshake,
  Briefcase,
  type LucideIcon
} from "lucide-react";

interface EmailPreview {
  subject: string;
  html: string;
  text: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview: EmailPreview;
}

interface TemplateCategory {
  id: string;
  title: string;
  icon: string;
  templates: Template[];
}

interface EmailTemplatesClientProps {
  templateCategories: TemplateCategory[];
}

const iconMap: Record<string, LucideIcon> = {
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Handshake,
  Briefcase,
};

export function EmailTemplatesClient({ templateCategories }: EmailTemplatesClientProps) {
  const [selectedCategory, setSelectedCategory] = useState(templateCategories[0]?.id ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [preview, setPreview] = useState<EmailPreview | null>(null);

  const currentCategory = templateCategories.find((cat) => cat.id === selectedCategory);
  const currentTemplate = currentCategory?.templates.find((t) => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = currentCategory?.templates.find((t) => t.id === templateId);
    if (template) {
      setPreview(template.preview);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Vista Previa de Plantillas de Email</h1>
        <p className="mt-2 text-gray-600">
          Explora y previsualiza todas las plantillas de email del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar - Template List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas</CardTitle>
              <CardDescription>Selecciona una categoría y plantilla</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selector */}
              <div className="flex flex-wrap gap-2">
                {templateCategories.map((category) => {
                  const Icon = iconMap[category.icon] ?? Mail;
                  const isActive = selectedCategory === category.id;
                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedTemplate(null);
                        setPreview(null);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {category.title}
                    </Button>
                  );
                })}
              </div>

              {/* Template List */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {currentCategory?.templates.map((template) => {
                    const TemplateIcon = iconMap[template.icon] ?? Mail;
                    const isSelected = selectedTemplate === template.id;
                    return (
                      <button
                        key={template.id}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <TemplateIcon className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0">
                          <div className={`font-medium ${isSelected ? "text-primary" : ""}`}>
                            {template.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentTemplate ? `Vista Previa: ${currentTemplate.name}` : "Selecciona una plantilla"}
              </CardTitle>
              <CardDescription>
                {currentTemplate
                  ? "Vista previa del email generado con datos reales (Task #149)"
                  : "Elige una plantilla de la lista para ver su vista previa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Asunto:</label>
                    <div className="rounded-lg border bg-gray-50 p-3 font-medium">
                      {preview.subject}
                    </div>
                  </div>

                  {/* HTML Preview */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Vista Previa HTML:</label>
                    <div className="rounded-lg border">
                      <iframe
                        srcDoc={preview.html}
                        className="h-[600px] w-full rounded-lg"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>

                  {/* Text Version */}
                  <details className="rounded-lg border">
                    <summary className="cursor-pointer p-3 font-medium">
                      Versión de Texto Plano
                    </summary>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap p-4 text-sm">
                      {preview.text}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="flex h-[600px] items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">Selecciona una plantilla para ver su vista previa</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
