"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Megaphone, CalendarDays } from "lucide-react";

export interface SerializedAnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetGroup: string;
  isPinned: boolean;
  publishedAt: string;
  branchName: string | null;
  departmentName: string | null;
}

interface LiffAnnouncementListProps {
  announcements: SerializedAnnouncementItem[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const thai = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return thai;
}

function targetLabel(a: SerializedAnnouncementItem): string | null {
  if (a.targetGroup === "BRANCH" && a.branchName) {
    return `เฉพาะสาขา ${a.branchName}`;
  }
  if (a.targetGroup === "DEPARTMENT" && a.departmentName) {
    return `เฉพาะแผนก ${a.departmentName}`;
  }
  return null;
}

export function LiffAnnouncementList({
  announcements,
}: LiffAnnouncementListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (announcements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e3e8ee] p-8 text-center bg-white shadow-xs">
        <Megaphone className="h-8 w-8 mx-auto text-[#64748d]/40 mb-2" />
        <p className="text-sm font-semibold text-[#0d253d]">ยังไม่มีประกาศ</p>
        <p className="text-xs text-[#64748d] mt-1">
          เมื่อองค์กรออกประกาศใหม่ ระบบจะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => {
        const isExpanded = expandedId === a.id;
        const target = targetLabel(a);

        return (
          <Card
            key={a.id}
            className={`border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden ${
              a.isPinned ? "border-[#533afd]/40" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : a.id)}
              className="w-full text-left p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    {a.isPinned && (
                      <Pin className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                    )}
                    <h3 className="text-sm font-bold text-[#0d253d] leading-snug">
                      {a.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-[#64748d] flex items-center">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      {formatDate(a.publishedAt)}
                    </span>
                    {target && (
                      <Badge
                        variant="outline"
                        className="text-[10px] rounded-full px-2 text-[#533afd] border-[#533afd]/30 bg-[#533afd]/5"
                      >
                        {target}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-[#64748d] shrink-0 mt-0.5">
                  {isExpanded ? "ย่อ ▲" : "อ่านต่อ ▼"}
                </span>
              </div>
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-1">
                <div className="rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]/70 p-3 text-xs text-[#475569] whitespace-pre-wrap leading-relaxed">
                  {a.content}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}