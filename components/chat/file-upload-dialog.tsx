"use client";

import { useEffect, useState } from "react";
import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CloudUpload,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  RefreshCwIcon,
  Trash2,
  TriangleAlert,
  Upload,
  VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadItem extends FileWithPreview {
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  files: externalFiles,
  onFilesChange: onExternalFilesChange,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
}: FileUploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept: "*",
    multiple: true,
    onFilesChange: (newFiles) => {
      // Convert to upload items when files change
      const newUploadFiles = newFiles.map((file) => {
        const existingFile = uploadFiles.find(
          (existing) => existing.id === file.id
        );

        if (existingFile) {
          return {
            ...existingFile,
            ...file,
          };
        } else {
          return {
            ...file,
            progress: 0,
            status: "uploading" as const,
          };
        }
      });
      setUploadFiles(newUploadFiles);
      onExternalFilesChange(newFiles);
    },
  });

  // Sync external files to internal state
  useEffect(() => {
    const syncedFiles = externalFiles.map((file) => {
      const existingFile = uploadFiles.find((uf) => uf.id === file.id);
      if (existingFile) {
        return existingFile;
      }
      return {
        ...file,
        progress: 100,
        status: "completed" as const,
      };
    });
    setUploadFiles(syncedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFiles]);

  // Simulate upload progress
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.status !== "uploading") return file;

          const increment = Math.random() * 20 + 10; // 10-30% increment
          const newProgress = Math.min(file.progress + increment, 100);

          if (newProgress >= 100) {
            const shouldFail = Math.random() < 0.05; // 5% chance to fail
            return {
              ...file,
              progress: 100,
              status: shouldFail ? ("error" as const) : ("completed" as const),
              error: shouldFail
                ? "Upload failed. Please try again."
                : undefined,
            };
          }

          return { ...file, progress: newProgress };
        })
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    removeFile(fileId);
  };

  const retryUpload = (fileId: string) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              progress: 0,
              status: "uploading" as const,
              error: undefined,
            }
          : file
      )
    );
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <ImageIcon className="size-4" />;
    if (type.startsWith("video/")) return <VideoIcon className="size-4" />;
    if (type.startsWith("audio/")) return <HeadphonesIcon className="size-4" />;
    if (type.includes("pdf")) return <FileTextIcon className="size-4" />;
    if (type.includes("word") || type.includes("doc"))
      return <FileTextIcon className="size-4" />;
    if (type.includes("excel") || type.includes("sheet"))
      return <FileSpreadsheetIcon className="size-4" />;
    if (type.includes("zip") || type.includes("rar"))
      return <FileArchiveIcon className="size-4" />;
    return <FileTextIcon className="size-4" />;
  };

  const getFileTypeLabel = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return "Image";
    if (type.startsWith("video/")) return "Video";
    if (type.startsWith("audio/")) return "Audio";
    if (type.includes("pdf")) return "PDF";
    if (type.includes("word") || type.includes("doc")) return "Word";
    if (type.includes("excel") || type.includes("sheet")) return "Excel";
    if (type.includes("zip") || type.includes("rar")) return "Archive";
    if (type.includes("json")) return "JSON";
    if (type.includes("text")) return "Text";
    return "File";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Attachments</DialogTitle>
          <DialogDescription>
            Upload and manage files to send with your message. Maximum file
            size: {formatBytes(maxSize)} • Maximum files: {maxFiles}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload Area */}
          <div
            className={cn(
              "relative rounded-lg border border-dashed p-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input {...getInputProps()} className="sr-only" />

            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors",
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25"
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drop files here or{" "}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="cursor-pointer text-blue-500 underline underline-offset-4 hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  All file types are supported
                </p>
              </div>
            </div>
          </div>

          {/* Files Table */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Files ({uploadFiles.length})
                </h3>
                <div className="flex gap-2">
                  <Button onClick={openFileDialog} variant="outline" size="sm">
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Add files
                  </Button>
                  <Button onClick={clearFiles} variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove all
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="h-9">Name</TableHead>
                      <TableHead className="h-9">Type</TableHead>
                      <TableHead className="h-9">Size</TableHead>
                      <TableHead className="h-9 w-[100px] text-end">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadFiles.map((fileItem) => (
                      <TableRow key={fileItem.id}>
                        <TableCell className="py-2 ps-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "size-8 shrink-0 relative flex items-center justify-center text-muted-foreground/80"
                              )}
                            >
                              {fileItem.status === "uploading" ? (
                                <div className="relative">
                                  {/* Circular progress background */}
                                  <svg
                                    className="size-8 -rotate-90"
                                    viewBox="0 0 32 32"
                                  >
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="14"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="text-muted-foreground/20"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="14"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeDasharray={`${2 * Math.PI * 14}`}
                                      strokeDashoffset={`${
                                        2 *
                                        Math.PI *
                                        14 *
                                        (1 - fileItem.progress / 100)
                                      }`}
                                      className="text-primary transition-all duration-300"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  {/* File icon in center */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    {getFileIcon(fileItem.file as File)}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  {getFileIcon(fileItem.file as File)}
                                </div>
                              )}
                            </div>
                            <p className="flex items-center gap-2 truncate text-sm font-medium">
                              {fileItem.file.name}
                              {fileItem.status === "error" && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Error
                                </Badge>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className="text-xs">
                            {getFileTypeLabel(fileItem.file as File)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">
                          {formatBytes(fileItem.file.size)}
                        </TableCell>
                        <TableCell className="py-2 pe-1">
                          <div className="flex items-center justify-end gap-1">
                            {fileItem.status === "error" ? (
                              <Button
                                onClick={() => retryUpload(fileItem.id)}
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive/80 hover:text-destructive"
                              >
                                <RefreshCwIcon className="size-4" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => removeUploadFile(fileItem.id)}
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive" className="mt-5">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>File upload error(s)</AlertTitle>
              <AlertDescription>
                {errors.map((error, index) => (
                  <p key={index} className="last:mb-0">
                    {error}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
