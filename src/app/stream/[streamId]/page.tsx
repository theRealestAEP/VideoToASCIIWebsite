import React from 'react';

interface StreamPageProps {
  params: { streamId: string };
}

export default function StreamPage({ params }: StreamPageProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">ASCII Video Stream</h1>
        <p className="text-gray-400 mb-8">Stream ID: {params.streamId}</p>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-center text-gray-400">
            This stream can be viewed in a terminal using:
          </p>
          <code className="block mt-4 p-4 bg-gray-700 rounded text-green-400 font-mono text-center">
            curl -s {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/terminal/{params.streamId} | bash
          </code>
        </div>
      </div>
    </div>
  );
}