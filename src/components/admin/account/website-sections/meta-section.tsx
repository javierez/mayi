import { useEffect, useState, useCallback } from "react";
import { Database, Plus, Trash2, Edit3, Info } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import type { MetaSectionProps } from "../types/website-sections";

interface MainPageConfig {
  title: string;
  description: string;
  keywords: string[];
  robots: {
    index: number;
    follow: number;
    googleBot: {
      index: number;
      follow: number;
      "max-snippet": number;
      "max-image-preview": string;
    };
  };
  openGraph: {
    title: string;
    description: string;
    type: string;
    locale: string;
    siteName: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
  };
  alternates: {
    canonical: string;
  };
}

export function MetaSection({
  form,
  isActive,
  onUnsavedChanges,
}: MetaSectionProps) {
  const [visibleDescriptions, setVisibleDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = useCallback((fieldName: string) => {
    setVisibleDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  }, []);

  const [mainPageConfig, setMainPageConfig] = useState<MainPageConfig>({
    title: "",
    description: "",
    keywords: [],
    robots: {
      index: 1,
      follow: 1,
      googleBot: {
        index: 1,
        follow: 1,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: "",
      description: "",
      type: "website",
      locale: "es_ES",
      siteName: "",
      images: [
        {
          url: "",
          width: 1200,
          height: 630,
          alt: "",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "",
      description: "",
      images: [""],
    },
    alternates: {
      canonical: "/",
    },
  });

  const [newKeyword, setNewKeyword] = useState("");

  // Watch for form changes to detect unsaved changes
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name?.startsWith("metadata")) {
        onUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Load and parse mainpage data
  useEffect(() => {
    console.log("🔍 META: Loading metadata.mainpage from form...");
    const mainpageValue = form.getValues("metadata.mainpage");
    console.log("🔍 META: Raw metadata.mainpage value:", mainpageValue);
    console.log("🔍 META: Value type:", typeof mainpageValue);

    if (mainpageValue) {
      if (typeof mainpageValue === "object" && mainpageValue !== null) {
        console.log("✅ META: mainpageValue is already an object");
        const objectValue = mainpageValue;

        if (objectValue.mainpage && typeof objectValue.mainpage === "object") {
          console.log(
            "✅ META: Found mainpage property in object:",
            objectValue.mainpage,
          );
          console.log(
            "🔍 META: mainpage keys:",
            Object.keys(objectValue.mainpage),
          );
          setMainPageConfig(objectValue.mainpage as MainPageConfig);
          console.log("✅ META: Set mainPageConfig state");
        } else if (objectValue.title && objectValue.description) {
          console.log("✅ META: Using object directly as mainpage config");
          setMainPageConfig(objectValue as unknown as MainPageConfig);
          console.log("✅ META: Set mainPageConfig state directly");
        } else {
          console.log(
            "⚠️ META: Object structure not recognized:",
            Object.keys(objectValue),
          );
        }
      } else if (typeof mainpageValue === "string") {
        console.log("🔍 META: mainpageValue is string, attempting to parse...");
        try {
          const parsed = JSON.parse(mainpageValue) as Record<string, unknown>;
          console.log("✅ META: Parsed JSON successfully:", parsed);

          if (parsed.mainpage && typeof parsed.mainpage === "object") {
            console.log("✅ META: Found mainpage object:", parsed.mainpage);
            setMainPageConfig(parsed.mainpage as MainPageConfig);
          } else if (parsed.title && parsed.description) {
            console.log(
              "✅ META: Using parsed data directly as mainpage config",
            );
            setMainPageConfig(parsed as unknown as MainPageConfig);
          }
        } catch (error) {
          console.error("❌ META: Error parsing mainpage JSON:", error);
        }
      }
    } else {
      console.log("⚠️ META: No metadata.mainpage value found in form");
    }
  }, [form]);

  // Save changes back to form
  const updateMainPageConfig = (newConfig: MainPageConfig) => {
    console.log("💾 META: Updating mainPageConfig:", newConfig);
    setMainPageConfig(newConfig);
    const metadataValue = {
      mainpage: newConfig,
    };
    const jsonString = JSON.stringify(metadataValue);
    console.log("💾 META: Setting form value to:", jsonString);
    form.setValue("metadata.mainpage", jsonString);
    console.log("💾 META: Triggering unsaved changes");
    onUnsavedChanges(true);
  };

  // Keyword management
  const addKeyword = () => {
    if (newKeyword.trim()) {
      const updatedConfig = {
        ...mainPageConfig,
        keywords: [...mainPageConfig.keywords, newKeyword.trim()],
      };
      updateMainPageConfig(updatedConfig);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    const updatedConfig = {
      ...mainPageConfig,
      keywords: mainPageConfig.keywords.filter((_, i) => i !== index),
    };
    updateMainPageConfig(updatedConfig);
  };

  // OpenGraph image management
  const addOgImage = () => {
    const updatedConfig = {
      ...mainPageConfig,
      openGraph: {
        ...mainPageConfig.openGraph,
        images: [
          ...mainPageConfig.openGraph.images,
          { url: "", width: 1200, height: 630, alt: "" },
        ],
      },
    };
    updateMainPageConfig(updatedConfig);
  };

  const removeOgImage = (index: number) => {
    const updatedConfig = {
      ...mainPageConfig,
      openGraph: {
        ...mainPageConfig.openGraph,
        images: mainPageConfig.openGraph.images.filter((_, i) => i !== index),
      },
    };
    updateMainPageConfig(updatedConfig);
  };

  // Twitter image management
  const addTwitterImage = () => {
    const updatedConfig = {
      ...mainPageConfig,
      twitter: {
        ...mainPageConfig.twitter,
        images: [...mainPageConfig.twitter.images, ""],
      },
    };
    updateMainPageConfig(updatedConfig);
  };

  const removeTwitterImage = (index: number) => {
    const updatedConfig = {
      ...mainPageConfig,
      twitter: {
        ...mainPageConfig.twitter,
        images: mainPageConfig.twitter.images.filter((_, i) => i !== index),
      },
    };
    updateMainPageConfig(updatedConfig);
  };

  // Only render when active section
  if (!isActive) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Database className="h-5 w-5 text-gray-500" />
          Configuración de Metadatos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configuración completa de SEO y metadatos para tu sitio web
        </p>
      </div>

      {/* Main Page Configuration */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">
          Configuración de Página Principal
        </h3>

        {/* Basic SEO */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">SEO Básico</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={mainPageConfig.title}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    title: e.target.value,
                  })
                }
                placeholder="Título de la página"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={mainPageConfig.description}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de la página"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Palabras Clave</h4>
          <div className="flex flex-wrap gap-2">
            {mainPageConfig.keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {keyword}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeKeyword(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Nueva palabra clave"
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addKeyword())
              }
            />
            <Button type="button" onClick={addKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Robots */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Configuración de Robots</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={mainPageConfig.robots.index === 1}
                onCheckedChange={(checked) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      index: checked ? 1 : 0,
                    },
                  })
                }
              />
              <label className="text-sm">Index</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={mainPageConfig.robots.follow === 1}
                onCheckedChange={(checked) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      follow: checked ? 1 : 0,
                    },
                  })
                }
              />
              <label className="text-sm">Follow</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={mainPageConfig.robots.googleBot.index === 1}
                onCheckedChange={(checked) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      googleBot: {
                        ...mainPageConfig.robots.googleBot,
                        index: checked ? 1 : 0,
                      },
                    },
                  })
                }
              />
              <label className="text-sm">GoogleBot Index</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={mainPageConfig.robots.googleBot.follow === 1}
                onCheckedChange={(checked) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      googleBot: {
                        ...mainPageConfig.robots.googleBot,
                        follow: checked ? 1 : 0,
                      },
                    },
                  })
                }
              />
              <label className="text-sm">GoogleBot Follow</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Max Snippet</label>
              <Input
                type="number"
                value={mainPageConfig.robots.googleBot["max-snippet"]}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      googleBot: {
                        ...mainPageConfig.robots.googleBot,
                        "max-snippet": parseInt(e.target.value) || -1,
                      },
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Image Preview</label>
              <select
                className="w-full rounded border p-2"
                value={mainPageConfig.robots.googleBot["max-image-preview"]}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    robots: {
                      ...mainPageConfig.robots,
                      googleBot: {
                        ...mainPageConfig.robots.googleBot,
                        "max-image-preview": e.target.value,
                      },
                    },
                  })
                }
              >
                <option value="none">None</option>
                <option value="standard">Standard</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* OpenGraph */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Open Graph</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Título OG</label>
              <Input
                value={mainPageConfig.openGraph.title}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    openGraph: {
                      ...mainPageConfig.openGraph,
                      title: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sitio Web</label>
              <Input
                value={mainPageConfig.openGraph.siteName}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    openGraph: {
                      ...mainPageConfig.openGraph,
                      siteName: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Descripción OG</label>
            <Textarea
              value={mainPageConfig.openGraph.description}
              onChange={(e) =>
                updateMainPageConfig({
                  ...mainPageConfig,
                  openGraph: {
                    ...mainPageConfig.openGraph,
                    description: e.target.value,
                  },
                })
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Input
                value={mainPageConfig.openGraph.type}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    openGraph: {
                      ...mainPageConfig.openGraph,
                      type: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Locale</label>
              <Input
                value={mainPageConfig.openGraph.locale}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    openGraph: {
                      ...mainPageConfig.openGraph,
                      locale: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* OpenGraph Images */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Imágenes Open Graph</label>
              <Button type="button" onClick={addOgImage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {mainPageConfig.openGraph.images.map((image, index) => (
              <div key={index} className="space-y-2 rounded border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Imagen {index + 1}
                  </span>
                  {mainPageConfig.openGraph.images.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOgImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="URL de la imagen"
                      value={image.url}
                      onChange={(e) => {
                        const updatedImages = [
                          ...mainPageConfig.openGraph.images,
                        ];
                        updatedImages[index] = {
                          ...image,
                          url: e.target.value,
                        };
                        updateMainPageConfig({
                          ...mainPageConfig,
                          openGraph: {
                            ...mainPageConfig.openGraph,
                            images: updatedImages,
                          },
                        });
                      }}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Ancho"
                    value={image.width}
                    onChange={(e) => {
                      const updatedImages = [
                        ...mainPageConfig.openGraph.images,
                      ];
                      updatedImages[index] = {
                        ...image,
                        width: parseInt(e.target.value) || 1200,
                      };
                      updateMainPageConfig({
                        ...mainPageConfig,
                        openGraph: {
                          ...mainPageConfig.openGraph,
                          images: updatedImages,
                        },
                      });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Alto"
                    value={image.height}
                    onChange={(e) => {
                      const updatedImages = [
                        ...mainPageConfig.openGraph.images,
                      ];
                      updatedImages[index] = {
                        ...image,
                        height: parseInt(e.target.value) || 630,
                      };
                      updateMainPageConfig({
                        ...mainPageConfig,
                        openGraph: {
                          ...mainPageConfig.openGraph,
                          images: updatedImages,
                        },
                      });
                    }}
                  />
                  <div className="col-span-2">
                    <Input
                      placeholder="Texto alternativo"
                      value={image.alt}
                      onChange={(e) => {
                        const updatedImages = [
                          ...mainPageConfig.openGraph.images,
                        ];
                        updatedImages[index] = {
                          ...image,
                          alt: e.target.value,
                        };
                        updateMainPageConfig({
                          ...mainPageConfig,
                          openGraph: {
                            ...mainPageConfig.openGraph,
                            images: updatedImages,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Twitter */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Twitter Cards</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Card</label>
              <select
                className="w-full rounded border p-2"
                value={mainPageConfig.twitter.card}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    twitter: {
                      ...mainPageConfig.twitter,
                      card: e.target.value,
                    },
                  })
                }
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Título Twitter</label>
              <Input
                value={mainPageConfig.twitter.title}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    twitter: {
                      ...mainPageConfig.twitter,
                      title: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción Twitter</label>
              <Textarea
                value={mainPageConfig.twitter.description}
                onChange={(e) =>
                  updateMainPageConfig({
                    ...mainPageConfig,
                    twitter: {
                      ...mainPageConfig.twitter,
                      description: e.target.value,
                    },
                  })
                }
                rows={2}
              />
            </div>

            {/* Twitter Images */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Imágenes Twitter</label>
                <Button type="button" onClick={addTwitterImage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {mainPageConfig.twitter.images.map((image, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <Input
                    placeholder="URL de la imagen"
                    value={image}
                    onChange={(e) => {
                      const updatedImages = [...mainPageConfig.twitter.images];
                      updatedImages[index] = e.target.value;
                      updateMainPageConfig({
                        ...mainPageConfig,
                        twitter: {
                          ...mainPageConfig.twitter,
                          images: updatedImages,
                        },
                      });
                    }}
                  />
                  {mainPageConfig.twitter.images.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTwitterImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alternates */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Alternates</h4>
          <div>
            <label className="text-sm font-medium">URL Canónica</label>
            <Input
              value={mainPageConfig.alternates.canonical}
              onChange={(e) =>
                updateMainPageConfig({
                  ...mainPageConfig,
                  alternates: { canonical: e.target.value },
                })
              }
              placeholder="/"
            />
          </div>
        </div>
      </div>

      {/* Raw JSON Editor */}
      <Separator />
      <div className="space-y-4">
        <h4 className="text-md flex items-center gap-2 font-medium">
          <Edit3 className="h-4 w-4" />
          Editor JSON Raw (Avanzado)
        </h4>
        <FormField
          control={form.control}
          name="metadata.mainpage"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => toggleDescription("metadata.mainpage")}
                  className="focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              {visibleDescriptions.has("metadata.mainpage") && (
                <FormDescription className="text-xs">
                  Configuración completa en formato JSON. Los cambios aquí
                  sobrescribirán la configuración visual anterior.
                </FormDescription>
              )}
              <FormControl>
                <Textarea
                  value={
                    typeof field.value === "string"
                      ? field.value
                      : JSON.stringify(field.value, null, 2)
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  placeholder='{"mainpage": {"title": "Mi sitio web", "description": "Descripción de mi sitio"}}'
                  rows={20}
                  className="font-mono text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
