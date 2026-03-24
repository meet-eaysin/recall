'use client';
import Link from 'next/link';
import React from 'react';
import { CiHeart } from 'react-icons/ci';
import { RotateCcwSquare } from 'lucide-react';

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
              <span className="text-lg font-bold text-white tracking-tight">Recall</span>
            </Link>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            © {new Date().getFullYear()} Recall. All rights reserved.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-3 items-start gap-10 md:mt-0">
          <div className="mt-4 flex flex-col justify-center space-y-4">
            <Link href="/app">
              <p className="text-neutral-300/60 hover:text-neutral-300/80">
                Workspace
              </p>
            </Link>
            <Link href="/docs">
              <p className="text-neutral-300/60 hover:text-neutral-300/80">
                Documentation
              </p>
            </Link>
          </div>
          <div className="mt-4 flex flex-col justify-center space-y-4">
            <Link href="https://x.com/AmanShakya0018" target="_blank">
              <p className="text-neutral-300/60 hover:text-neutral-300/80">
                Twitter
              </p>
            </Link>
            <Link href="https://www.github.com/amanshakya0018/" target="_blank">
              <p className="text-neutral-300/60 hover:text-neutral-300/80">
                Github
              </p>
            </Link>
          </div>
          <div className="mt-4 flex flex-col justify-center space-y-4">
            <p className="text-neutral-300/60 hover:text-neutral-300/80">
              <Link href="/termsofservice" target="_blank">
                Terms of Service
              </Link>
            </p>
            <p className="text-neutral-300/60 hover:text-neutral-300/80">
              <Link href="/privacypolicy" target="_blank">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
      <p className="-mb-6 mt-12 w-full text-center text-sm text-neutral-300">
        Made with{' '}
        <CiHeart className="inline-block h-5 w-5 pb-0.5 align-middle text-neutral-300" />{' '}
        by{' '}
        <a
          href="https://amanshakya.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:underline"
        >
          this guy
        </a>
      </p>
    </div>
  );
};

export default Footer;
