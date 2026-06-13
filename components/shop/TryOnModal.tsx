"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Upload,
  X,
  Download,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getTryOnStatusLabel, useTryOn } from "@/hooks/useTryOn";

interface Props {
  open: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
}

type UploadStep = "upload" | "result";

export default function TryOnModal({
  open,
  onClose,
  productImage,
  productName,
}: Props) {
  const [uploadStep, setUploadStep] = useState<UploadStep>("upload");
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  // previewUrl is tracked in a ref so we can revoke it on cleanup — fixes memory leak
  const previewUrlRef = useRef<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, resultUrl, error, startTryOn, reset } = useTryOn();

  // ── Derive compound step ────────────────────────────────────────────────────
  const isGenerating =
    status === "uploading" || status === "processing";
  const isFailed = status === "failed";

  // Transition to result view once AI succeeds
  useEffect(() => {
    if (status === "succeeded" && resultUrl) {
      setUploadStep("result");
    }
  }, [status, resultUrl]);

  // ── Revoke object URL on unmount / photo change — fixes memory leak ─────────
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setPhoto(file: File) {
    // Revoke previous object URL before creating a new one
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setUserPhoto(file);
    setPreviewUrl(url);
  }

  function clearPhoto() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setUserPhoto(null);
    setPreviewUrl("");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setPhoto(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    // FIX: removed duplicate null check
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setPhoto(file);
  }

  async function handleGenerate() {
    if (!userPhoto) return;

    try {
      // Step 1 — Upload user photo to Cloudinary
      const formData = new FormData();
      formData.append("file", userPhoto);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.error ?? "Photo upload failed");
      }

      const { url: userPhotoUrl } = await uploadRes.json();

      // Step 2 — Kick off AI try-on (polling handled inside useTryOn hook)
      await startTryOn({
        userPhotoUrl,
        garmentImageUrl: productImage,
        garmentDescription: productName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  }

  // FIX: append/remove from DOM so it works in Firefox too
  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `tryon-${productName.replace(/\s+/g, "-")}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleReset() {
    clearPhoto();
    reset();
    setUploadStep("upload");
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  // ── Status label shown during generation ────────────────────────────────────
  // FIX: real status labels mapped from API state, not a hardcoded string
  const statusLabel = getTryOnStatusLabel(status);

  // ── Estimated progress for the progress bar ─────────────────────────────────
  // FIX: progress reflects real pipeline stages instead of a static 75%
  // ✅ Complete ternary chain
  const progressPercent =
  status === "uploading"  ? 20 :
  status === "processing" ? 60 :
  status === "succeeded"  ? 100 : 0;
    
    

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                AI Virtual Try-On
              </h2>
              <p className="text-xs text-gray-400">{productName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* ── Upload Step ─────────────────────────────────────────────────── */}
          {uploadStep === "upload" && !isGenerating && !isFailed && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* User photo */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Your Photo
                  </p>
                  {previewUrl ? (
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200">
                      <Image
                        src={previewUrl}
                        alt="Your photo"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={clearPhoto}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-xs font-medium text-gray-600">
                          Click to upload
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Garment preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Garment
                  </p>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={productImage}
                      alt={productName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs bg-white/90 text-gray-700 px-2 py-1 rounded-lg font-medium line-clamp-1">
                        {productName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Tips for best results
                </p>
                <ul className="text-xs text-amber-700 space-y-0.5">
                  <li>• Use a clear, well-lit full-body photo</li>
                  <li>• Stand straight facing the camera</li>
                  <li>• Wear fitted clothing so AI can detect your shape</li>
                </ul>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!userPhoto}
                className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate Try-On
              </button>
            </div>
          )}

          {/* ── Generating Step ──────────────────────────────────────────────── */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-violet-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-100">
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">
                  AI is generating your look...
                </h3>
                {/* FIX: real status label + accurate time estimate */}
                <p className="text-sm text-gray-500">{statusLabel}</p>
                <p className="text-xs text-gray-400 mt-1">
                  This model typically takes 2–4 minutes
                </p>
              </div>

              {/* FIX: progress bar driven by real pipeline stage */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {progressPercent}% — {statusLabel}
                </p>
              </div>
            </div>
          )}

          {/* ── Error Step ───────────────────────────────────────────────────── */}
          {isFailed && (
            <div className="py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Generation failed
                </h3>
                {/* FIX: shows the real error from the API (includes debug detail) */}
                <p className="text-sm text-gray-500 max-w-xs">
                  {error ?? "Something went wrong. Please try again."}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="bg-violet-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Result Step ──────────────────────────────────────────────────── */}
          {uploadStep === "result" && resultUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">
                  Your AI try-on is ready!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Your Photo
                  </p>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={previewUrl}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-violet-600 font-semibold mb-2 text-center">
                    AI Result ✨
                  </p>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-violet-300">
                    <Image
                      src={resultUrl}
                      alt="Try-on result"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Try Another Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}