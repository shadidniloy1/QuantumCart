"use client";

import { useState, useRef } from "react";
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

interface Props {
  open: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
}

type Step = "upload" | "generating" | "result" | "error";

export default function TryOnModal({
  open,
  onClose,
  productImage,
  productName,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUserPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUserPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    if (!userPhoto) return;
    setStep("generating");

    try {
      // Step - 1: upload user photo to Cloudinary
      const formData = new FormData();
      formData.append("file", userPhoto);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Photo upload failed");
      const { url: userPhotoUrl } = await uploadRes.json();

      // Step - 2: Call AI try-on
      const tryonRes = await fetch("/api/ai/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhotoUrl,
          garmentImageUrl: productImage,
          garmentDescription: productName,
        }),
      });

      if (!tryonRes.ok) {
        const err = await tryonRes.json();
        throw new Error(err.detail || "AI generation failed");
      }

      const { resultUrl } = await tryonRes.json();
      setResultUrl(resultUrl);
      setStep("result");
    } catch (error: any) {
      console.error("Try-on error:", error);
      setErrorMsg(error.message || "Something went wrong");
      setStep("error");
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `tryon-${productName.replace(/\s+/g, "-")}.png`;
    a.target = "_blank";
    a.click();
  }

  function resetModal() {
    setStep("upload");
    setUserPhoto(null);
    setPreviewUrl("");
    setResultUrl("");
    setErrorMsg("");
  }

  function handleClose() {
    resetModal();
    onClose();
  }

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
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* User photo upload */}
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
                        onClick={() => {
                          setUserPhoto(null);
                          setPreviewUrl("");
                        }}
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
                      <div className="text-center">
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

              {/* Generate */}
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

          {/* Generating Step */}
          {step === "generating" && (
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
                <h3 className="font-semibold text-gray-900 mb-2">
                  AI is generating your look...
                </h3>
                <p className="text-sm text-gray-500">
                  This takes about 30–60 seconds. Please wait.
                </p>
              </div>

              {/* Progress bar animation */}
              <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">
                  Your AI try-on is ready!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
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
                {/* Resultt */}
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
                  onClick={resetModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Try Another Photo
                </button>
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === "error" && (
            <div className="py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Generation failed
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={resetModal}
                className="bg-violet-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
