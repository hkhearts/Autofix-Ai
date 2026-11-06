"use client";

import React, { useRef, useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  previewUrl?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  previewUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile || previewUrl ? (
        <div className="relative rounded-xl border border-yellow-500/70 bg-yellow-500/10 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5 overflow-hidden">
            <div className="w-14 h-14 rounded-lg bg-black/10 dark:bg-black/50 border border-yellow-500/40 flex items-center justify-center shrink-0 overflow-hidden">
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Screenshot"
                  className="w-full h-full object-cover"
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-yellow-700 dark:text-yellow-300 truncate">
                {selectedFile?.name || "Attached Error Telemetry Screenshot"}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready for OCR`
                  : "Ready for Hindsight & OCR extraction"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Remove screenshot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ease-out py-7 px-4 flex flex-col items-center justify-center text-center ${
            isDragging
              ? "border-yellow-500 bg-yellow-500/20 scale-[1.01] shadow-md"
              : "border-yellow-500/70 hover:border-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 hover:scale-[1.01] active:scale-[0.99] hover:shadow-xs"
          }`}
        >
          <div className="w-11 h-11 rounded-full border border-yellow-500/40 bg-yellow-400/20 flex items-center justify-center mb-2.5 text-yellow-600 dark:text-yellow-400 shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
            DRAG AND DROP OR CLICK TO UPLOAD SCREENSHOT
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Supports PNG, JPG, or JPEG error trace captures
          </p>
        </div>
      )}
    </div>
  );
};
