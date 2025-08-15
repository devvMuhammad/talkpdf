"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { UploadCloud, FileText, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileProgressCards } from "@/components/ui/file-progress-cards";
import { useFileHandler } from "@/hooks/use-file-handler";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@clerk/nextjs";
import { toast } from "sonner";

export default function WelcomeStage() {
  const createConversation = useMutation(api.conversations.create)
  const updateConversation = useMutation(api.conversations.update)
  const addMessages = useMutation(api.conversations.addMessages)
  const generateTitle = useAction(api.titleGeneration.generateTitle)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [indexingCompleted, setIndexingCompleted] = useState(false);
  const [processStarted, setProcessStarted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useSession()

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful!', {
        description: 'Your account has been upgraded. You can now use your new credits.',
        duration: 5000,
      });
      // Remove the payment parameter from URL
      router.replace('/chat', { scroll: false });
    }
  }, [searchParams, router]);

  const {
    isUploading,
    isIndexing,
    uploadFiles,
    indexFiles,
  } = useFileHandler()


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

  const handleUploadFiles = async () => {
    if (!session?.user.id) return;
    if (!selectedFiles.length) return;

    setUploadSuccess(null);
    setErrorMessage(null);
    setUploadCompleted(false);
    setIndexingCompleted(false);
    setProcessStarted(true);

    try {
      // Upload files using the new hook
      const uploadedFiles = await uploadFiles(selectedFiles);
      setUploadCompleted(true);

      // Small delay to allow smooth transition animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create conversation first with temporary title
      const conversationId = await createConversation({
        title: selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} PDFs`,
        userId: session.user.id
      });

      // Index the uploaded files with conversation ID
      let indexingResults;
      try {
        indexingResults = await indexFiles(uploadedFiles, conversationId);
        setIndexingCompleted(true);
        setUploadSuccess(`Successfully processed ${uploadedFiles.length} PDF(s)`);
      } catch (indexError) {
        const errorMsg = indexError instanceof Error ? indexError.message : "Failed to process PDFs for search";
        setErrorMessage(`Upload successful but indexing failed: ${errorMsg}`);
        setProcessStarted(false);
        return;
      }

      // Generate conversation title from extracted text content using AI
      const textContentArray = indexingResults.map(result => result.textContent);
      const fileNames = selectedFiles.map(file => file.name);

      try {
        const titleResult = await generateTitle({
          textContent: textContentArray.filter(Boolean) as string[],
          fileNames: fileNames
        });

        const conversationTitle = titleResult.title || (fileNames.length === 1 ? fileNames[0] : `${fileNames.length} PDFs`);

        // Update conversation title
        await updateConversation({
          id: conversationId,
          title: conversationTitle
        });
      } catch (titleError) {
        console.error("Failed to generate title:", titleError);
        // Keep the temporary title if generation fails
      }

      // Create messages with parts structure matching UIMessage
      const userMessageWithFiles = {
        role: "user" as const,
        parts: uploadedFiles.map(file => ({
          type: "file",
          mediaType: file.type,
          filename: file.name,
          url: file.url
        })),
        createdAt: Date.now(),
      };

      const assistantMessage = {
        role: "assistant" as const,
        parts: [{
          type: "text",
          text: "Your PDFs are uploaded and indexed. I can now help you explore their content, answer questions, summarize information, and more. What would you like to know?"
        }],
        createdAt: Date.now(),
      };

      // Add both messages using the batch function
      await addMessages({
        conversationId,
        messages: [userMessageWithFiles, assistantMessage]
      });

      router.replace(`/chat/${conversationId}`);
      setProcessStarted(false);

    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(errorMsg);
      setUploadSuccess(null);
      setProcessStarted(false);
    }
  };

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

              {processStarted && (
                <div className="mt-4">
                  <FileProgressCards
                    isUploading={isUploading}
                    isIndexing={isIndexing}
                    uploadCompleted={uploadCompleted}
                    indexingCompleted={indexingCompleted}
                    files={selectedFiles.map(f => f.name)}
                    processStarted={processStarted}
                  />
                </div>
              )}

              {errorMessage && (
                <div className="mt-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle2
                    className={`h-4 w-4 ${uploadSuccess && !errorMessage ? "text-green-400" : "text-gray-500"
                      }`}
                  />
                  <span>
                    {uploadSuccess && !errorMessage
                      ? uploadSuccess
                      : "Files are uploaded securely for analysis."}
                  </span>
                </div>
                <Button
                  onClick={handleUploadFiles}
                  disabled={isUploading || isIndexing || selectedFiles.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? "Uploading..." : isIndexing ? "Processing..." : "Upload PDFs"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}