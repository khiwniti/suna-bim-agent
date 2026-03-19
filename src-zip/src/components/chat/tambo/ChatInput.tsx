"use client";

import { useEffect, useCallback } from "react";
import { Paperclip, Upload, X, Mic, MicOff, Loader2 } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  disabled?: boolean;
  triggerUpload?: boolean;
  onUploadTriggered?: () => void;
  /** Thread input state from parent (ChatPanel) */
  value?: string;
  setValue?: (value: string | ((prev: string) => string)) => void;
  submit?: () => Promise<{ threadId: string | undefined }>;
  isPending?: boolean;
  isDisabled?: boolean;
  /** Voice input state from parent (ChatPanel) */
  isRecording?: boolean;
  transcript?: string;
  startRecording?: () => void;
  stopRecording?: () => void;
  transcriptionError?: string;
  isTranscribing?: boolean;
}

export function ChatInput({
  disabled,
  triggerUpload,
  onUploadTriggered,
  value = "",
  setValue,
  submit,
  isPending = false,
  isDisabled = false,
  isRecording = false,
  transcript = "",
  startRecording,
  stopRecording,
  transcriptionError = "",
  isTranscribing = false,
}: ChatInputProps) {
  const isVoiceSupported = typeof window !== 'undefined' && 'mediaDevices' in navigator;

  useEffect(() => {
    if (transcript && setValue) {
      setValue((prev: string) => {
        const newValue = prev ? `${prev} ${transcript}` : transcript;
        return newValue;
      });
    }
  }, [transcript, setValue]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording && stopRecording) {
      stopRecording();
    } else if (startRecording) {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const {
    openFilePicker,
    uploadState,
    progress,
    currentFile,
    error,
    cancel,
    dropZoneProps,
    isDragActive,
  } = useFileUpload({
    autoActivatePanel: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value?.trim() || disabled || isPending || !submit) return;
    await submit();
  };

  const isInputDisabled = disabled || isPending || isDisabled;
  const isUploading = uploadState === "uploading";

  useEffect(() => {
    if (triggerUpload && !isUploading) {
      openFilePicker();
      onUploadTriggered?.();
    }
  }, [triggerUpload, isUploading, openFilePicker, onUploadTriggered]);

  return (
    <div
      {...dropZoneProps}
      className={cn(
        "border-t p-4",
        isDragActive && "bg-primary/5 ring-2 ring-primary ring-inset",
      )}
    >
      {isUploading && currentFile && (
        <div className="mb-3 rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm font-medium truncate">
                {currentFile.name}
              </span>
            </div>
            <button
              onClick={cancel}
              className="text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{progress}%</span>
            <span>Opening {currentFile.targetPanel}...</span>
          </div>
        </div>
      )}

      {uploadState === "error" && error && (
        <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue?.(e.target.value)}
            placeholder="Type a message..."
            disabled={isInputDisabled}
            className="flex-1 rounded-md border px-3 py-2 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploading}
            className={cn(
              "rounded-md border px-3 py-2 transition-colors",
              "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
              "text-muted-foreground hover:text-foreground",
            )}
            title="Upload file (IFC, PDF, Excel, Image)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          {isVoiceSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isInputDisabled || isTranscribing}
              className={cn(
                "rounded-md border px-3 py-2 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isRecording
                  ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={isInputDisabled || !value?.trim() || isUploading}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>
        {transcriptionError && (
          <div className="mt-2 text-xs text-destructive">
            Voice error: {transcriptionError}
          </div>
        )}
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording... Click mic to stop
          </div>
        )}
      </form>

      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg border-2 border-dashed border-primary m-4">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Drop files here</p>
            <p className="text-xs text-muted-foreground">
              IFC • PDF • Excel • Images
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
