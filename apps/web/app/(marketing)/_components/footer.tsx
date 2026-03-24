'use client';
import Link from 'next/link';
import React from 'react';
import {
  RotateCcwSquare,
  Twitter,
  Github,
  Linkedin,
  MessageCircle,
} from 'lucide-react';

const Footer = () => {
  return (
    <div className="block border-t border-white/10 px-3 py-12 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 text-sm text-neutral-400 sm:flex-row">
        <div>
          <div className="mb-2 flex">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-neutral-800 to-neutral-900 text-white border border-neutral-700">
                <RotateCcwSquare className="size-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Recall
              </span>
            </Link>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            © {new Date().getFullYear()} Recall. All rights reserved.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-10 md:mt-0 md:grid-cols-4">
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <Link
              href="#features"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Features
            </Link>
            <Link
              href="/app/settings"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Settings
            </Link>
            <Link
              href="/changelog"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Changelog
            </Link>
            <Link
              href="/status"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Status
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Community</h4>
            <Link
              href="https://github.com/amanshakya0018/"
              target="_blank"
              className="flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <Github size={14} /> GitHub
            </Link>
            <Link
              href="https://discord.gg/recall"
              target="_blank"
              className="flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <MessageCircle size={14} /> Discord
            </Link>
            <Link
              href="https://x.com/AmanShakya0018"
              target="_blank"
              className="flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <Twitter size={14} /> Twitter (X)
            </Link>
            <Link
              href="https://linkedin.com/in/amanshakya"
              target="_blank"
              className="flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <Linkedin size={14} /> LinkedIn
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <Link
              href="/termsofservice"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacypolicy"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Cookie Policy
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <Link
              href="/about"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              About
            </Link>
            <Link
              href="/app/analytics"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Analytics
            </Link>
            <Link
              href="/app/graph"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Graph
            </Link>
            <Link
              href="/contact"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
      <p className="-mb-6 mt-16 w-full text-center text-xs text-neutral-500 pt-8 border-t border-white/5">
        Recall by{' '}
        <a
          href="https://meet-eaysin.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 hover:text-white transition-colors"
        >
          Eaysin Arafat
        </a>
      </p>
    </div>
  );
};

export default Footer;
