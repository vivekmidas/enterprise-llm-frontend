'use client';

import Link from 'next/link';
import { Cpu, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
          <Cpu className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = '/admin';
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Work Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50/50"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
          >
            Log in to Console <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">New to Gateway?</span>
          <Link href="/signup" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Current Version: 0.2.3 • Status: All users default to Admin
      </p>
    </div>
  );
}
