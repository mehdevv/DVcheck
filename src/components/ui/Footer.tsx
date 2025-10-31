import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-notion-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-notion-gray-600">
        <div className="text-center sm:text-left">
          <p className="font-medium text-notion-gray-700">
            This platform is for <span className="text-notion-blue-600 font-semibold">Digitalvalley Club</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-center sm:text-right">
          <span>Developed by</span>
          <a
            href="https://www.pluss.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-notion-blue-600 hover:text-notion-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            pluss.dev
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};

