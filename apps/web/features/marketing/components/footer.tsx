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

const communityLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/meet-eaysin/',
    icon: Github,
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/Ub5MQyqn',
    icon: MessageCircle,
  },
  {
    name: 'Twitter (X)',
    href: 'https://x.com/meet_eaysin',
    icon: Twitter,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/meet-eaysin',
    icon: Linkedin,
  },
];

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
        <div className="mt-10 grid grid-cols-2 gap-10 md:mt-0 md:grid-cols-2">
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Community</h4>
            {communityLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                className="flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
              >
                <link.icon size={14} /> {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <Link
              href="/terms-of-service"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy-policy"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookie-policy"
              className="text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Cookie Policy
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
