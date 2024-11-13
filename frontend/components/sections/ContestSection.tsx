"use client";

import Link from "next/link";
import React from "react";
import AnimateOnScroll from "../AnimationOnScroll";
import { useTranslation } from "@/lib/useTranslation";
type Props = {};

function ContestSection({}: Props) {
  const { t } = useTranslation();
  return (
    <AnimateOnScroll>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t("contest.title")}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t("contest.description")}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
              <Link
                href="/contest/create"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                prefetch={false}
              >
                {t("contest.createButton")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
}

export default ContestSection;
