'use client';

import { Case } from '@/lib/types/case';
import { Badge } from '@/app/components/Badge';
import { Zap } from 'lucide-react';

interface CaseCardProps {
  caseData: Case;
}

export default function CaseCard({ caseData }: CaseCardProps) {
  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">{caseData.title}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{caseData.description}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {caseData.judge && (
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                {caseData.judge}
              </Badge>
            )}
            {caseData.court && (
              <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                {caseData.court}
              </Badge>
            )}
            {caseData.location && (
              <Badge className="bg-orange-50 text-orange-700 border border-orange-200 text-xs">
                {caseData.location}
              </Badge>
            )}
            <Badge className={`${statusColors[caseData.status] || statusColors.open} border text-xs`}>
              {caseData.status}
            </Badge>
          </div>

          {caseData.article && (
            <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
              {caseData.article}
            </p>
          )}

          {caseData.relevance_score && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
              <Zap size={14} />
              Relevance: {Math.round(caseData.relevance_score * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
