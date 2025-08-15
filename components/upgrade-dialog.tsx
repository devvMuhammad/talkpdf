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
import { useUser } from "@clerk/nextjs";
import { DEFAULT_LIMITS, PRICING } from "@/lib/config";

const upgradeSchema = z.object({
  tokens: z.number()
    .min(PRICING.TOKENS_PER_DOLLAR, `Minimum ${PRICING.TOKENS_PER_DOLLAR.toLocaleString()} tokens`)
    .max(100000, "Maximum 100,000 tokens")
    .default(DEFAULT_LIMITS.FREE_TOKENS),
  storage: z.number()
    .min(0, "Storage cannot be negative")
    .max(10 * 1024, "Maximum 10GB storage") // In MB for easier input
    .default(PRICING.STORAGE_MB_PER_DOLLAR),
});

type UpgradeFormData = z.infer<typeof upgradeSchema>;

interface BillingData {
  tokensUsed: number;
  tokensLimit: number;
  storageUsed: number;
  storageLimit: number;
  subscriptionType: "free" | "paid";
  subscriptionStatus: "active" | "cancelled" | "expired";
}

interface UpgradeDialogProps {
  currentBilling: BillingData;
  onSuccess: () => void;
}

export function UpgradeDialog({ currentBilling, onSuccess }: UpgradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      tokens: DEFAULT_LIMITS.FREE_TOKENS,
      storage: PRICING.STORAGE_MB_PER_DOLLAR,
    }
  });

  const watchedValues = watch();

  // Calculate costs
  const tokenCost = Math.ceil(watchedValues.tokens / PRICING.TOKENS_PER_DOLLAR); // $1 per configured tokens
  const storageCost = Math.ceil(watchedValues.storage / PRICING.STORAGE_MB_PER_DOLLAR); // $1 per configured storage
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
    if (!user?.id) {
      toast.error("User not authenticated", {
        className: "bg-red-950 text-red-50 border-red-800",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create Lemon Squeezy checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: data.tokens,
          storage: data.storage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout creation failed');
      }

      const { checkout_url, summary } = await response.json();

      // Redirect user to Lemon Squeezy checkout
      window.location.href = checkout_url;

      // Note: The onSuccess callback will be called via webhook after successful payment
      // For now, we'll show a message that the user is being redirected
      toast.success("Redirecting to checkout...", {
        description: `You'll be charged $${summary.total_cost} for ${summary.tokens.toLocaleString()} tokens and ${summary.storage_mb}MB storage`,
      });

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again",
        className: "bg-red-950 text-red-50 border-red-800",
      });
      setIsSubmitting(false); // Reset loading state on error
    }
    // Note: We don't reset setIsSubmitting on success since the user is being redirected
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
            step={PRICING.TOKENS_PER_DOLLAR}
            {...register("tokens", { valueAsNumber: true })}
            className="text-right"
          />
          {errors.tokens && (
            <p className="text-sm text-red-500">{errors.tokens.message}</p>
          )}
          <p className="text-xs text-gray-500">
            $1 per {PRICING.TOKENS_PER_DOLLAR.toLocaleString()} tokens • Cost: ${tokenCost}
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
            $1 per {PRICING.STORAGE_MB_PER_DOLLAR}MB • Cost: ${storageCost}
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
            "Redirecting to checkout..."
          ) : (
            `Pay $${totalCost} with Lemon Squeezy`
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