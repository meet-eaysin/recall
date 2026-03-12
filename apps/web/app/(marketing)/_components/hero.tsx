import { Library } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative isolate min-h-svh overflow-hidden border-b border-subtle">
      <div className="relative z-10 mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center px-6 py-10 text-center md:py-16">
        <div className="mb-8 flex items-center gap-2">
          <Library />
          <span className="text-sm font-normal tracking-wide">
            <span className="font-semibold">Dev</span> Me
          </span>
        </div>

        <h1
          className="mb-10 text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Google Sans Display', 'DM Sans', sans-serif" }}
        >
          Experience liftoff with the<br />
          next&#8209;generation IDE
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1 4.7-2.6 6.2l-.4.4V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.4l-.4-.4A9 9 0 0 1 5 9a7 7 0 0 1 7-7zm-1.5 14h3v2h-3v-2zm1.5-3a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
            </svg>
            Download for Linux
          </Link>

          <Link
            href="/use-cases"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
          >
            Explore use cases
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;