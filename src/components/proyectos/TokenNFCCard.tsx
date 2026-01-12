"use client";

import { alerts } from "@/lib/alerts";

interface TokenNFCCardProps {
  tokenNfc: string;
  onRegenerar: () => void;
}

export default function TokenNFCCard({ tokenNfc, onRegenerar }: TokenNFCCardProps) {
  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenNfc);
    alerts.success("Token copiado al portapapeles");
  };

  const handleCopyFullLink = () => {
    const fullUrl = `${window.location.origin}/proyecto/${tokenNfc}`;
    navigator.clipboard.writeText(fullUrl);
    alerts.success("Link completo copiado");
  };

  return (
    <div className="bg-blue-50 rounded-xl shadow-md p-8 border-2 border-blue-200 max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">
            Token NFC del Proyecto
          </h3>
          
          {/* Token */}
          <div className="flex items-center gap-3 mb-3">
            <code className="flex-1 bg-white px-4 py-3 rounded-lg border-2 border-gray-300 text-sm font-mono font-bold text-gray-900 break-all">
              {tokenNfc}
            </code>
            <button
              onClick={handleCopyToken}
              className="px-4 py-3 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg transition text-sm font-semibold text-gray-700"
              title="Copiar token"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          {/* Link completo */}
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-green-300">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              🔗 Link de Vista del Cliente:
            </p>
            <div className="flex items-center gap-2">
              <a 
                href={`/proyecto/${tokenNfc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-blue-600 hover:text-blue-800 underline font-mono text-sm break-all"
              >
                {typeof window !== 'undefined' ? window.location.origin : ''}/proyecto/{tokenNfc}
              </a>
              <button
                onClick={handleCopyFullLink}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-xs font-semibold flex-shrink-0"
                title="Copiar link completo"
              >
                Copiar Link
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              👆 Click en el link para probar la vista del cliente o copia el link completo
            </p>
          </div>

          {/* Botón regenerar */}
          <button
            onClick={onRegenerar}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerar Token
          </button>
          <p className="text-xs text-gray-600 mt-2">
            ⚠️ Al regenerar, el token actual dejará de funcionar
          </p>
        </div>
      </div>
    </div>
  );
}
