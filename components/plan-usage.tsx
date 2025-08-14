"use client";

import { Crown, Zap, Database, Cpu, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UpgradeDialog } from "./upgrade-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function PlanUsage() {
  const { user } = useUser();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const billing = useQuery(api.billing.getUserBilling, user?.id ? { userId: user.id } : "skip");
  const initializeBilling = useMutation(api.billing.initializeUserBilling);

  // Auto-initialize billing when it's null for authenticated users
  useEffect(() => {
    if (billing === null && user?.id && !isInitializing) {
      setIsInitializing(true);
      initializeBilling({ userId: user.id })
        .then(() => {
          toast.success("Account initialized with free credits!");
        })
        .catch((error) => {
          console.error("Failed to initialize billing:", error);
          toast.error("Failed to initialize account. Please try refreshing the page.");
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [billing, user?.id, isInitializing, initializeBilling]);

  if (billing === undefined || !user) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-2 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (billing === null) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-center space-x-2">
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-300">Initializing your account...</span>
            </>
          ) : (
            <span className="text-sm text-gray-300">Setting up your billing data...</span>
          )}
        </div>
      </div>
    );
  }

  const tokenUsagePercent = (billing.tokensUsed / billing.tokensLimit) * 100;
  const storageUsagePercent = (billing.storageUsed / billing.storageLimit) * 100;

  // Check if limits are exceeded or close to being exceeded
  const tokenLimitExceeded = billing.tokensUsed >= billing.tokensLimit;
  const storageLimitExceeded = billing.storageUsed >= billing.storageLimit;
  const tokenLimitClose = tokenUsagePercent >= 85 && !tokenLimitExceeded; // 85% threshold
  const storageLimitClose = storageUsagePercent >= 85 && !storageLimitExceeded;

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(0)}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700" data-testid="plan-usage">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown size={16} className={billing.subscriptionType === "paid" ? "text-yellow-500" : "text-gray-500"} />
          <span className="text-sm font-semibold text-gray-100">
            {billing.subscriptionType === "paid" ? "Pro Plan" : "Free Plan"}
          </span>
          <Badge
            variant="secondary"
            className={`text-xs ${billing.subscriptionStatus === "active"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
              }`}
          >
            {billing.subscriptionStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {/* Tokens Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Cpu size={12} className={tokenLimitExceeded ? "text-red-400" : tokenLimitClose ? "text-yellow-400" : "text-gray-400"} />
              <span className={tokenLimitExceeded ? "text-red-400" : tokenLimitClose ? "text-yellow-400" : "text-gray-400"}>
                Tokens
              </span>
              {tokenLimitExceeded && (
                <AlertCircle size={12} className="text-red-400" />
              )}
              {tokenLimitClose && !tokenLimitExceeded && (
                <AlertTriangle size={12} className="text-yellow-400" />
              )}
            </div>
            <span className={`font-medium ${tokenLimitExceeded ? "text-red-400" : tokenLimitClose ? "text-yellow-400" : "text-gray-100"}`}>
              {(Math.min(billing.tokensUsed, billing.tokensLimit)).toLocaleString()} / {billing.tokensLimit.toLocaleString()}
            </span>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Progress
                    value={Math.min(tokenUsagePercent, 100)}
                    className={`h-2 bg-gray-700 cursor-pointer ${tokenLimitExceeded ? "[&>div]:bg-red-500" :
                      tokenLimitClose ? "[&>div]:bg-yellow-500" : ""
                      }`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tokens used: {billing.tokensUsed.toLocaleString()}</p>
                <p>Token limit: {billing.tokensLimit.toLocaleString()}</p>
                {tokenLimitExceeded && (
                  <p className="text-red-300 font-medium">⚠️ Limit Exceeded - Upgrade Required</p>
                )}
                {tokenLimitClose && !tokenLimitExceeded && (
                  <p className="text-yellow-300 font-medium">⚠️ Approaching Limit</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {tokenLimitExceeded && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={10} />
              <span>Token limit exceeded. Upgrade to continue chatting.</span>
            </div>
          )}
          {tokenLimitClose && !tokenLimitExceeded && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle size={10} />
              <span>Running low on tokens. Consider upgrading soon.</span>
            </div>
          )}
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Database size={12} className={storageLimitExceeded ? "text-red-400" : storageLimitClose ? "text-yellow-400" : "text-gray-400"} />
              <span className={storageLimitExceeded ? "text-red-400" : storageLimitClose ? "text-yellow-400" : "text-gray-400"}>
                Storage
              </span>
              {storageLimitExceeded && (
                <AlertCircle size={12} className="text-red-400" />
              )}
              {storageLimitClose && !storageLimitExceeded && (
                <AlertTriangle size={12} className="text-yellow-400" />
              )}
            </div>
            <span className={`font-medium ${storageLimitExceeded ? "text-red-400" : storageLimitClose ? "text-yellow-400" : "text-gray-100"}`}>
              {formatStorage(Math.min(billing.storageUsed, billing.storageLimit))} / {formatStorage(billing.storageLimit)}
            </span>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Progress
                    value={Math.min(storageUsagePercent, 100)}
                    className={`h-2 bg-gray-700 cursor-pointer ${storageLimitExceeded ? "[&>div]:bg-red-500" :
                      storageLimitClose ? "[&>div]:bg-yellow-500" : ""
                      }`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Storage used: {formatStorage(billing.storageUsed)}</p>
                <p>Storage limit: {formatStorage(billing.storageLimit)}</p>
                {storageLimitExceeded && (
                  <p className="text-red-300 font-medium">⚠️ Limit Exceeded - Upgrade Required</p>
                )}
                {storageLimitClose && !storageLimitExceeded && (
                  <p className="text-yellow-300 font-medium">⚠️ Approaching Limit</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {storageLimitExceeded && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={10} />
              <span>Storage limit exceeded. Upgrade to upload more files.</span>
            </div>
          )}
          {storageLimitClose && !storageLimitExceeded && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle size={10} />
              <span>Running low on storage. Consider upgrading soon.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-400">
            <Zap size={12} />
            <span>Pay as you use</span>
          </div>
          <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={tokenLimitExceeded || storageLimitExceeded ? "default" : "ghost"}
                size="sm"
                className={`h-6 px-2 text-xs ${tokenLimitExceeded || storageLimitExceeded
                  ? "bg-red-600 hover:bg-red-700 text-white font-medium"
                  : tokenLimitClose || storageLimitClose
                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 font-medium"
                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                  }`}
              >
                {tokenLimitExceeded || storageLimitExceeded ? "Upgrade Now" : "Upgrade"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <UpgradeDialog
                currentBilling={billing}
                onSuccess={() => {
                  setUpgradeDialogOpen(false);
                  // The query will automatically refresh the data
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall limit exceeded warning */}
        {(tokenLimitExceeded || storageLimitExceeded) && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="text-sm text-red-400 font-medium">
                  Account limits exceeded
                </div>
                <div className="text-xs text-red-300">
                  {tokenLimitExceeded && storageLimitExceeded
                    ? "Both token and storage limits have been reached."
                    : tokenLimitExceeded
                      ? "Token limit reached. Chat functionality is limited."
                      : "Storage limit reached. File uploads are blocked."
                  } Upgrade your plan to continue using TalkPDF.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
