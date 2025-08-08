"use client";

import type React from "react";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function PlanUsage() {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-yellow-500" />
          <span className="text-sm font-semibold text-gray-100">Pro Plan</span>
          <Badge
            variant="secondary"
            className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Active
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Credits remaining</span>
            <span className="text-gray-100 font-medium">2,847 / 5,000</span>
          </div>
          <Progress value={57} className="h-2 bg-gray-700" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-400">
            <Zap size={12} />
            <span>Resets in 12 days</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
          >
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}
