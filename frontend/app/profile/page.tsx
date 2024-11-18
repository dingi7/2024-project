"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getUserAttendedContests } from "../api/requests";
import { Contest } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

export default function Component() {
  const { data: session } = useSession();
  const user = session?.user;
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchContests = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const contests: Contest[] = await getUserAttendedContests(user.id);
        setContests(contests.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, [user?.id]);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-6 flex flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-background rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((u) => u[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <div className="text-lg font-medium">{user?.name}</div>
              <div className="text-sm text-muted-foreground">
                @{user?.name?.split(" ").join("").toLowerCase()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-lg border p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{t('profile.attendedContests')}</h2>
            <Link
              href="#"
              className="text-sm text-primary hover:underline"
              prefetch={false}
            >
              {t('profile.viewAll')}
            </Link>
          </div>
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">{t('profile.loading')}</div>
            ) : contests.length === 0 ? (
              <div className="text-center text-muted-foreground">{t('profile.noContests')}</div>
            ) : (
              contests.map((contest: Contest) => {
                return (
                  <div
                    key={contest.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4"
                  >
                    <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                      <TrophyIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{contest.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(contest.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="default">
                      <Link href={`/contest/${contest.id}`}>{t('profile.viewContest')}</Link>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function StarIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrophyIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
