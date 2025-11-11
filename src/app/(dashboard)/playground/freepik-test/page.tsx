"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function FreepikTestPage() {
  const [imageUrl, setImageUrl] = useState(
    "https://inmobiliariaacropolis.s3.us-east-1.amazonaws.com/VESTA2025000001/images/image_5_kim_ZS.jpeg"
  );
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);

  // API Parameters
  const [sharpen, setSharpen] = useState(0);
  const [smartGrain, setSmartGrain] = useState(0);
  const [ultraDetail, setUltraDetail] = useState(0);
  const [flavor, setFlavor] = useState<"sublime" | "photo" | "photo_denoiser">("photo");
  const [scaleFactor, setScaleFactor] = useState(2);

  const checkAllTasks = async () => {
    setLoading(true);
    setStatus("Fetching all tasks...");

    try {
      const response = await fetch("/api/playground/freepik-test?all=true");
      const data = await response.json() as { tasks?: unknown[] };
      setResult(JSON.stringify(data, null, 2));
      setStatus(
        `Found ${data.tasks?.length ?? 0} task(s) in your account`
      );
      setEnhancedImageUrl(null);
    } catch (error) {
      setStatus("Error: " + (error instanceof Error ? error.message : "Unknown"));
      setResult(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const startUpscale = async () => {
    setLoading(true);
    setResult("");
    setStatus("Starting...");

    try {
      const response = await fetch("/api/playground/freepik-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          sharpen,
          smartGrain,
          ultraDetail,
          flavor,
          scaleFactor,
        }),
      });

      const data = await response.json() as { taskId?: string };
      setResult(JSON.stringify(data, null, 2));

      if (data.taskId) {
        setTaskId(data.taskId);
        setStatus(`Task created: ${data.taskId}`);
        setEnhancedImageUrl(null);
      } else {
        setStatus("Failed to create task");
      }
    } catch (error) {
      setStatus("Error: " + (error instanceof Error ? error.message : "Unknown"));
      setResult(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!taskId) return;

    setLoading(true);
    setStatus("Checking status...");

    try {
      const response = await fetch(
        `/api/playground/freepik-test?taskId=${taskId}`
      );
      const data = await response.json() as { status?: string; generated?: string[] };
      setResult(JSON.stringify(data, null, 2));
      setStatus(`Status: ${data.status ?? "unknown"}`);

      // If completed, show the image
      if (data.status === "COMPLETED" && data.generated?.[0]) {
        setEnhancedImageUrl(data.generated[0]);
      }
    } catch (error) {
      setStatus("Error: " + (error instanceof Error ? error.message : "Unknown"));
      setResult(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Freepik API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sharpen (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={sharpen}
                onChange={(e) => setSharpen(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Smart Grain (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={smartGrain}
                onChange={(e) => setSmartGrain(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ultra Detail (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={ultraDetail}
                onChange={(e) => setUltraDetail(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flavor</label>
              <select
                value={flavor}
                onChange={(e) => setFlavor(e.target.value as "sublime" | "photo" | "photo_denoiser")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="photo">Photo</option>
                <option value="sublime">Sublime</option>
                <option value="photo_denoiser">Photo Denoiser</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scale Factor</label>
              <select
                value={scaleFactor}
                onChange={(e) => setScaleFactor(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="2">2x</option>
                <option value="4">4x</option>
                <option value="8">8x</option>
                <option value="16">16x</option>
              </select>
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                onClick={() => {
                  setSharpen(0);
                  setSmartGrain(0);
                  setUltraDetail(0);
                  setFlavor("photo");
                  setScaleFactor(2);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Reset to Cheapest
              </Button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={startUpscale} disabled={loading || !imageUrl}>
              {loading ? "Processing..." : "Start Upscale"}
            </Button>
            <Button
              onClick={checkStatus}
              disabled={loading || !taskId}
              variant="outline"
            >
              Check Status
            </Button>
            <Button
              onClick={checkAllTasks}
              disabled={loading}
              variant="secondary"
            >
              View All Tasks
            </Button>
          </div>

          {/* Status */}
          {status && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Status:</p>
              <p className="text-sm">{status}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <p className="text-sm font-medium">API Response:</p>
              <pre className="p-4 bg-black text-green-400 rounded-md overflow-auto text-xs max-h-96">
                {result}
              </pre>
            </div>
          )}

          {/* Task ID */}
          {taskId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm font-medium">Task ID:</p>
              <p className="text-xs font-mono break-all">{taskId}</p>
            </div>
          )}

          {/* Enhanced Image */}
          {enhancedImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">✅ Enhanced Image:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Original</p>
                  <div className="relative w-full aspect-video">
                    <Image
                      src={imageUrl}
                      alt="Original"
                      fill
                      className="object-contain rounded-md border"
                      unoptimized
                    />
                  </div>
                </div>
                {/* Enhanced */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Enhanced</p>
                  <div className="relative w-full aspect-video">
                    <Image
                      src={enhancedImageUrl}
                      alt="Enhanced"
                      fill
                      className="object-contain rounded-md border"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
              <a
                href={enhancedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open enhanced image in new tab →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
