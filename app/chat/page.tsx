"use client";

import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TinyLoader } from "@/components/ui/tiny-loader";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";

function WelcomeStage() {

  const saveFile = useMutation(api.files.saveFile)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const indexFiles = useAction(api.indexing.indexFiles)
  const createConversation = useMutation(api.conversations.create)
  const addMessage = useMutation(api.conversations.addMessage)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [isIndexing, setIsIndexing] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { session } = useSession()


  const onFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfs.length) {
      setSelectedFiles((prev) => [...prev, ...pdfs]);
      setUploadSuccess(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onFilesChosen(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSizeLabel = useMemo(() => {
    const total = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const mb = total / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, [selectedFiles]);

  const uploadFiles = useCallback(async () => {

    if (!session?.user.id) return;

    if (!selectedFiles.length) return;
    setIsUploading(true);
    setIsIndexing(false);

    setUploadSuccess(null);
    try {
      // Step 1-3 per Convex docs for each file
      const savedFileIds: string[] = [];
      for (const file of selectedFiles) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Failed to upload to Convex storage");
        const { storageId } = await result.json();
        const fileId = await saveFile({
          storageId,
          name: file.name,
          size: file.size,
          type: file.type,
        });
        savedFileIds.push(fileId as unknown as string);
      }

      setUploadSuccess(`Uploaded ${savedFileIds.length} file(s) successfully`);

      // Optional: simple indexing step without SSE, just a loading state
      setIsIndexing(true);
      await indexFiles({ fileIds: savedFileIds as Id<"files">[] });

      // Create conversation and redirect
      const assistantMessage = "Your PDFs are uploaded and indexed. How can I help you explore them today?";
      const conversationId = await createConversation({
        title: selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} PDFs`,
        userId: session.user.id
      });
      await addMessage({ conversationId, role: "assistant", content: assistantMessage });
      router.replace(`/chat/${conversationId}`);
    } catch (err) {
      console.error(err);
      setUploadSuccess("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setIsIndexing(false);
    }
  }, [selectedFiles, session?.user.id]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-100">Welcome to TalkPDF</h1>
          <p className="text-gray-400 text-lg">
            Get started by uploading one or more PDF files, or ask a question
            directly.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed ${isDragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-gray-700 bg-gray-900/60"
            } p-8 transition-colors`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => onFilesChosen(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-gray-800 p-3 border border-gray-700">
              <UploadCloud className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-gray-200">
              Drag and drop your PDFs here, or
              <button
                type="button"
                className="ml-1 text-blue-400 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Only PDF files are supported
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-300">
                  Selected files ({selectedFiles.length}) • {totalSizeLabel}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-gray-300"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear
                </Button>
              </div>
              <ul className="space-y-2 max-h-56 overflow-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-300" />
                      <div>
                        <div className="text-sm text-gray-100 line-clamp-1">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-200"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {(isUploading || isIndexing) && (
                <div className="mt-4">
                  <TinyLoader label={isUploading ? "Uploading..." : "Indexing..."} />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle2
                    className={`h-4 w-4 ${uploadSuccess ? "text-green-400" : "text-gray-500"
                      }`}
                  />
                  <span>
                    {uploadSuccess
                      ? uploadSuccess
                      : "Files are uploaded securely for analysis."}
                  </span>
                </div>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? "Uploading..." : "Upload PDFs"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {

  return (
    <div className="flex-1 bg-gray-950 overflow-hidden">
      <WelcomeStage />
    </div>
  );
}
