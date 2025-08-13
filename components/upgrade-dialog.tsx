"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Database, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";

const upgradeSchema = z.object({
  tokens: z.number()
    .min(1000, "Minimum 1,000 tokens")
    .max(100000, "Maximum 100,000 tokens")
    .default(5000),
  storage: z.number()
    .min(0, "Storage cannot be negative")
    .max(10 * 1024, "Maximum 10GB storage") // In MB for easier input
    .default(500),
});

type UpgradeFormData = z.infer<typeof upgradeSchema>;

interface BillingData {
  tokensUsed: number;
  tokensLimit: number;
  storageUsed: number;
  storageLimit: number;
  subscriptionType: "free" | "paid";
  subscriptionStatus: "active" | "inactive" | "cancelled";
}

interface UpgradeDialogProps {
  currentBilling: BillingData;
  onSuccess: () => void;
}

export function UpgradeDialog({ currentBilling, onSuccess }: UpgradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      tokens: 5000,
      storage: 500,
    }
  });

  const watchedValues = watch();
  
  // Calculate costs
  const tokenCost = Math.ceil(watchedValues.tokens / 1000); // $1 per 1k tokens
  const storageCost = Math.ceil(watchedValues.storage / 500); // $1 per 500MB
  const totalCost = tokenCost + storageCost;

  // Calculate new limits
  const newTokenLimit = currentBilling.tokensLimit + watchedValues.tokens;
  const newStorageLimit = currentBilling.storageLimit + (watchedValues.storage * 1024 * 1024); // Convert MB to bytes

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const onSubmit = async (data: UpgradeFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokensToAdd: data.tokens,
          storageToAdd: data.storage * 1024 * 1024, // Convert MB to bytes
          subscriptionType: "paid",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upgrade failed");
      }

      const result = await response.json();
      
      toast.success("Upgrade successful!", {
        description: `Added ${data.tokens.toLocaleString()} tokens and ${data.storage}MB storage`,
      });

      onSuccess();
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Upgrade failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <DialogHeader className="mb-6">
        <DialogTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Upgrade Your Plan
        </DialogTitle>
        <DialogDescription>
          Add more tokens and storage to your account. Pay only for what you need.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <Cpu size={14} />
                Tokens
              </span>
              <span>{currentBilling.tokensUsed.toLocaleString()} / {currentBilling.tokensLimit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <Database size={14} />
                Storage
              </span>
              <span>{formatStorage(currentBilling.storageUsed)} / {formatStorage(currentBilling.storageLimit)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Add Tokens */}
        <div className="space-y-2">
          <Label htmlFor="tokens" className="flex items-center gap-2">
            <Cpu size={16} />
            Add Tokens
          </Label>
          <Input
            id="tokens"
            type="number"
            step={1000}
            {...register("tokens", { valueAsNumber: true })}
            className="text-right"
          />
          {errors.tokens && (
            <p className="text-sm text-red-500">{errors.tokens.message}</p>
          )}
          <p className="text-xs text-gray-500">
            $1 per 1,000 tokens • Cost: ${tokenCost}
          </p>
        </div>

        {/* Add Storage */}
        <div className="space-y-2">
          <Label htmlFor="storage" className="flex items-center gap-2">
            <Database size={16} />
            Add Storage (MB)
          </Label>
          <Input
            id="storage"
            type="number"
            step={100}
            {...register("storage", { valueAsNumber: true })}
            className="text-right"
          />
          {errors.storage && (
            <p className="text-sm text-red-500">{errors.storage.message}</p>
          )}
          <p className="text-xs text-gray-500">
            $1 per 500MB • Cost: ${storageCost}
          </p>
        </div>

        <Separator />

        {/* Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign size={16} />
              Upgrade Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>New Token Limit:</span>
              <Badge variant="secondary">
                {newTokenLimit.toLocaleString()}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>New Storage Limit:</span>
              <Badge variant="secondary">
                {formatStorage(newStorageLimit)}
              </Badge>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total Cost:</span>
              <span className="text-green-600">${totalCost}</span>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || totalCost === 0}
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            `Upgrade for $${totalCost}`
          )}
        </Button>

        {/* Pricing Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Tokens are used for AI conversations and file processing</p>
          <p>• Storage is used for uploaded PDF files</p>
          <p>• No monthly fees - pay only for what you use</p>
        </div>
      </form>
    </div>
  );
}