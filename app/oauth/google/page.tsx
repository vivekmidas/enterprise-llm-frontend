'use client';

import React from 'react';

/**
 * Page to initiate the Google OAuth connection flow.
 * Triggers the redirect to /api/oauth/google/connect which handles the Google Auth URL generation.
 */
export default function GoogleOAuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-xl text-center max-w-md border border-gray-200">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900">Google OAuth</h1>
        <p className="text-gray-600 mb-8">
          Authorize this application to access your Gmail data for automated workflows.
        </p>
        <a
          href="/api/oauth/google/connect"
          className="block w-full bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
        >
          Connect Google Account
        </a>
      </div>
    </div>
  );
}
