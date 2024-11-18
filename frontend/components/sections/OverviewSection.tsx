"use client"

import { CodeIcon, TrophyIcon, UserIcon } from "lucide-react";
import React from "react";
import AnimateOnScroll from "../AnimationOnScroll";
import { useTranslation } from "@/lib/useTranslation";

type Props = {};

const OverviewSection = (props: Props) => {
  const { t } = useTranslation();
  return (
    <AnimateOnScroll>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t("overview.title")}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t("overview.description")}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary p-2 text-primary-foreground">
                  <UserIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">
                  {t("overview.features.registration.title")}
                </h3>
              </div>
              <p className="text-muted-foreground">
                {t("overview.features.registration.description")}
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary p-2 text-primary-foreground">
                  <CodeIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">
                  {t("overview.features.challenges.title")}
                </h3>
              </div>
              <p className="text-muted-foreground">
                {t("overview.features.challenges.description")}
              </p>
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary p-2 text-primary-foreground">
                  <TrophyIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">
                  {t("overview.features.leaderboards.title")}
                </h3>
              </div>
              <p className="text-muted-foreground">
                {t("overview.features.leaderboards.description")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

export default OverviewSection;
