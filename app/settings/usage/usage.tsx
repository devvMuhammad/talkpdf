"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";

interface TokenTransaction {
  _id: string;
  _creationTime: number;
  userId: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed: number;
  operationType: "chat_message" | "file_processing" | "embedding_generation" | "query_embedding";
  description?: string;
  createdAt: number;
}

interface StorageTransaction {
  _id: string;
  _creationTime: number;
  userId: string;
  fileId?: string;
  sizeBytes: number;
  operationType: "file_upload" | "file_delete";
  filename?: string;
  createdAt: number;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatTokens(tokens: number) {
  return tokens.toLocaleString();
}

function getOperationTypeColor(type: string) {
  switch (type) {
    case "chat_message":
      return "text-blue-600";
    case "file_processing":
      return "text-green-600";
    case "embedding_generation":
      return "text-purple-600";
    case "query_embedding":
      return "text-orange-600";
    case "file_upload":
      return "text-green-600";
    case "file_delete":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function TransactionSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
    </TableRow>
  );
}

export default function UsagePage() {
  const { userId } = useAuth();
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [storageTransactions, setStorageTransactions] = useState<StorageTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [tokenResponse, storageResponse] = await Promise.all([
          fetch(`/api/usage?type=tokens&limit=50`),
          fetch(`/api/usage?type=storage&limit=50`),
        ]);

        if (!tokenResponse.ok || !storageResponse.ok) {
          throw new Error("Failed to fetch usage data");
        }

        const tokenData = await tokenResponse.json();
        const storageData = await storageResponse.json();

        setTokenTransactions(tokenData.transactions || []);
        setStorageTransactions(storageData.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (!userId) {
    return <div>Please sign in to view usage data.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Usage</h3>
        <p className="text-sm text-muted-foreground">
          Track your token and storage usage across all activities.
        </p>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens">Token Usage</TabsTrigger>
          <TabsTrigger value="storage">Storage Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Conversation</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TransactionSkeleton key={i} />
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : tokenTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No token usage found
                    </TableCell>
                  </TableRow>
                ) : (
                  tokenTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <span className={getOperationTypeColor(transaction.operationType)}>
                          {transaction.operationType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>{formatTokens(transaction.tokensUsed)}</TableCell>
                      <TableCell>
                        {transaction.conversationId ? (
                          <span className="text-xs text-muted-foreground">
                            {transaction.conversationId.slice(-8)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>File ID</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TransactionSkeleton key={i} />
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : storageTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No storage usage found
                    </TableCell>
                  </TableRow>
                ) : (
                  storageTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <span className={getOperationTypeColor(transaction.operationType)}>
                          {transaction.operationType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.sizeBytes < 0 ? "text-red-600" : "text-green-600"}>
                          {transaction.sizeBytes < 0 ? "-" : "+"}
                          {formatBytes(Math.abs(transaction.sizeBytes))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.fileId ? (
                          <span className="text-xs text-muted-foreground">
                            {transaction.fileId.slice(-8)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.filename || "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}