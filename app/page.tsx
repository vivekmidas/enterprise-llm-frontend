'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Bot,
  Workflow,
  Zap,
  Shield,
  Activity,
  ArrowRight,
  Github,
  Cpu,
  LogOut,
  User,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const email = localStorage.getItem('user_email');
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <main>
        <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap className="h-3.3 w-3.3" /> New: v0.2.3 Discovery Engine
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 text-gray-900">
            Automate LLM workflows <br />
            <span className="text-blue-600">without limits.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            The open-source gateway to orchestrate enterprise-grade LLM agents. Connect models,
            build complex chains, and monitor everything in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
            >
              Start Building Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/admin"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all"
            >
              View Demo Registry
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-8 py-24 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                  <Workflow className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Visual Orchestration</h3>
                <p className="text-gray-600 leading-relaxed">
                  Build complex multi-node workflows using our drag-and-drop interface. Seamlessly
                  connect triggers to agents.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Enterprise Security</h3>
                <p className="text-gray-600 leading-relaxed">
                  Manage API keys, define strict RBAC rules (coming soon), and ensure data sanctity
                  with internal validation nodes.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Deep Observability</h3>
                <p className="text-gray-600 leading-relaxed">
                  Full MELT support (Metrics, Events, Logs, Traces). Monitor latency and token usage
                  across every execution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="px-8 py-20 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Bot className="h-12 w-12 text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold mb-6 italic text-gray-800">
              "The easiest way to bridge the gap between internal data and LLM capability."
            </h2>
            <p className="text-gray-500 font-medium">— Engineering Team, Gateway Project</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale opacity-60">
            <Cpu className="h-5 w-5" />
            <span className="font-bold">Enterprise LLM Gateway</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500 font-medium">
            <Link href="#" className="hover:text-blue-600">
              Documentation
            </Link>
            <Link href="#" className="hover:text-blue-600">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-blue-600">
              Terms of Service
            </Link>
            {/* <Link href="https://github.com" className="hover:text-blue-600">
              GitHub
            </Link> */}
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Enterprise LLM Gateway. MIT Licensed.
          </p>
        </div>
      </footer>
    </div>
  );
}
