"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import AnimationOnScroll from "@/components/AnimationOnScroll";

function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-dotted-pattern opacity-10 pointer-events-none"></div>
      <AnimationOnScroll>
        <div className="container px-4 md:px-6 text-center">
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Conquer the Code
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mx-auto leading-relaxed">
                Join our thrilling programming contest and showcase your coding
                prowess. Compete against the best, win amazing prizes, and
                elevate your skills to new heights.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              {session ? (
                <Link
                  href="/contests"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  prefetch={false}
                >
                  Compete Now
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  prefetch={false}
                >
                  Login to Compete
                </Link>
              )}
            </div>
          </div>
        </div>
      </AnimationOnScroll>
    </section>
  );
}

export default HeroSection;