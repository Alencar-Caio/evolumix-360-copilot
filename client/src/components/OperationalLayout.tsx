import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OperationalLayoutProps {
  chatSection: ReactNode;
  sidebarSection: ReactNode;
  header?: ReactNode;
}

export default function OperationalLayout({
  chatSection,
  sidebarSection,
  header,
}: OperationalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      {header && (
        <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {header}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Chat Section - 70% */}
        <div className="flex-1 flex flex-col border-r border-slate-700/50 overflow-hidden">
          {chatSection}
        </div>

        {/* Sidebar Section - 30% */}
        <div className="w-[30%] flex flex-col bg-slate-900/30 border-l border-slate-700/50 overflow-hidden">
          {sidebarSection}
        </div>
      </div>
    </div>
  );
}
