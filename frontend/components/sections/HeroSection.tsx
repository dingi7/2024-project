import Link from "next/link";
import React from "react";
import image from "@/public/heroImage.jpg";

type Props = {};

function HeroSection({}: Props) {
  return (
    <section
      className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center min-h-screen bg-gray-100"
      style={{ backgroundImage: `url(${image.src})`, backgroundSize: "cover" }}
    >
      <div className="container px-4 md:px-6 text-center">
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              Conquer the Code
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
              Join our thrilling programming contest and showcase your coding
              prowess. Compete against the best, win amazing prizes, and elevate
              your skills to new heights.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
            <Link
              href="#"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              prefetch={false}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
