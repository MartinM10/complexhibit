"use client";

import { useRef } from "react";
import { CopyUri } from "@/components/CopyUri";
import { PDFDownloadButton } from "@/components/pdf/PDFDownloadButton";
import { DetailExportButton } from "@/components/detail"; // Assuming this is exported from index
import { unCamel } from "@/lib/utils";

interface DetailClientProps {
  label: string;
  type: string;
  fullUri: string;
  properties: Record<string, unknown>;
  sparqlQueries: string[];
  children: React.ReactNode;
}

export function DetailClient({
  label,
  type,
  fullUri,
  properties,
  sparqlQueries,
  children
}: DetailClientProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100" ref={cardRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 opacity-90">
            <span className="uppercase tracking-wider text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              {unCamel(type)}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{label}</h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap no-print">
            <CopyUri uri={fullUri} label="URI" />
            
            <DetailExportButton
              entityLabel={label}
              entityType={type}
              entityData={properties}
              sparqlQueries={sparqlQueries}
            />
            
            <div className="hidden md:block">
              <PDFDownloadButton
                targetRef={cardRef}
                label={label}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {children}
      </div>
    </div>
  );
}
