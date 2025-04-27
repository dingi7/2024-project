"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
    getGithubUserInfoById,
    getUserAttendedContests,
    getUserOwnedContests,
    getUserInvitedContests,
} from "../api/requests";
import { Contest } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { GithubIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";

export default function Component() {
    const { data: session } = useSession();
    const user = session?.user;
    const [userInfo, setUserInfo] = useState<{
        id: string;
        name: string;
        email: string;
        login: string;
        avatar_url: string;
        location: string;
        bio: string;
        public_repos: number;
        created_at: string;
        html_url: string;
    } | null>(null);
    const [contests, setContests] = useState<Contest[]>([]);
    const [ownedContests, setOwnedContests] = useState<Contest[]>([]);
    const [invitedContests, setInvitedContests] = useState<Contest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingOwned, setIsLoadingOwned] = useState(true);
    const [isLoadingInvited, setIsLoadingInvited] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchContests = async () => {
            if (!user?.id) return;
            try {
                setIsLoading(true);
                const contests: Contest[] = await getUserAttendedContests(
                    user.id
                );
                setContests(
                    contests.sort(
                        (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                    )
                );
            } catch (error) {
                console.error("Error fetching contests:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        const fetchOwnedContests = async () => {
            if (!user?.id) return;
            try {
                setIsLoadingOwned(true);
                const contests: Contest[] = await getUserOwnedContests(
                    user.id
                );
                setOwnedContests(
                    contests.sort(
                        (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                    )
                );
            } catch (error) {
                console.error("Error fetching owned contests:", error);
            } finally {
                setIsLoadingOwned(false);
            }
        };
        
        const fetchInvitedContests = async () => {
            if (!user?.id) return;
            try {
                setIsLoadingInvited(true);
                const contests: Contest[] = await getUserInvitedContests(
                    user.id
                );
                setInvitedContests(
                    contests.sort(
                        (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                    )
                );
            } catch (error) {
                console.error("Error fetching invited contests:", error);
            } finally {
                setIsLoadingInvited(false);
            }
        };
        
        const fetchUserInfo = async () => {
            if (!user?.id) return;
            try {
                const data = await getGithubUserInfoById(user.id);
                setUserInfo(data);
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };
        fetchUserInfo();
        fetchContests();
        fetchOwnedContests();
        fetchInvitedContests();
    }, [user?.id]);

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-6 flex flex-col flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-background rounded-lg border p-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage
                                src={userInfo?.avatar_url || user?.image || ""}
                            />
                            <AvatarFallback>
                                {user?.name
                                    ?.split(" ")
                                    .map((u) => u[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <div className="text-lg font-medium">
                                {userInfo?.name || user?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                @
                                {userInfo?.login ||
                                    user?.name
                                        ?.split(" ")
                                        .join("")
                                        .toLowerCase()}
                            </div>
                            {userInfo?.location && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPinIcon size={16} />
                                    {userInfo.location}
                                </div>
                            )}
                            <a
                                href={
                                    userInfo?.html_url ||
                                    `https://github.com/${user?.name
                                        ?.split(" ")
                                        .join("")
                                        .toLowerCase()}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                                <GithubIcon size={16} />
                                GitHub Profile
                            </a>
                        </div>
                    </div>
                    {userInfo?.bio && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            {userInfo.bio}
                        </div>
                    )}
                    <div className="flex flex-col mt-2">
                        <span className="text-sm font-medium">
                            {userInfo?.created_at
                                ? new Date(userInfo.created_at).getFullYear()
                                : "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Joined GitHub
                        </span>
                    </div>
                </div>
                <div className="bg-background rounded-lg border p-6 col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium">
                            {t("profile.attendedContests")}
                        </h2>
                        <Link
                            href="#"
                            className="text-sm text-primary hover:underline"
                            prefetch={false}
                        >
                            {t("profile.viewAll")}
                        </Link>
                    </div>
                    <div className="grid gap-4">
                        {isLoading ? (
                            <div className="text-center text-muted-foreground">
                                {t("profile.loading")}
                            </div>
                        ) : contests.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                                {t("profile.noContests")}
                            </div>
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
                                            <div className="font-medium">
                                                {contest.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(
                                                    contest.startDate
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Button variant="default">
                                            <Link
                                                href={`/contest/${contest.id}`}
                                            >
                                                {t("profile.viewContest")}
                                            </Link>
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">
                                {t("profile.ownedContests") || "Contests You Own"}
                            </h2>
                            <Link
                                href="/contest/create"
                                className="text-sm text-primary hover:underline"
                                prefetch={false}
                            >
                                {t("profile.createContest") || "Create New Contest"}
                            </Link>
                        </div>
                        <div className="grid gap-4">
                            {isLoadingOwned ? (
                                <div className="text-center text-muted-foreground">
                                    {t("profile.loading")}
                                </div>
                            ) : ownedContests.length === 0 ? (
                                <div className="text-center text-muted-foreground">
                                    {t("profile.noOwnedContests") || "You don't own any contests yet"}
                                </div>
                            ) : (
                                ownedContests.map((contest: Contest) => {
                                    return (
                                        <div
                                            key={contest.id}
                                            className="grid grid-cols-[auto_1fr_auto] items-center gap-4"
                                        >
                                            <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                                                <CrownIcon className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {contest.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        contest.startDate
                                                    ).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Button variant="default">
                                                <Link
                                                    href={`/contest/${contest.id}`}
                                                >
                                                    {t("profile.manageContest") || "Manage"}
                                                </Link>
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">
                                {t("profile.invitedContests") || "Contests You're Invited To"}
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {isLoadingInvited ? (
                                <div className="text-center text-muted-foreground">
                                    {t("profile.loading")}
                                </div>
                            ) : invitedContests.length === 0 ? (
                                <div className="text-center text-muted-foreground">
                                    {t("profile.noInvitedContests") || "You don't have any contest invitations"}
                                </div>
                            ) : (
                                invitedContests.map((contest: Contest) => {
                                    return (
                                        <div
                                            key={contest.id}
                                            className="grid grid-cols-[auto_1fr_auto] items-center gap-4"
                                        >
                                            <div className="bg-muted rounded-md flex items-center justify-center aspect-square w-10">
                                                <EnvelopeIcon className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {contest.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        contest.startDate
                                                    ).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Button variant="default">
                                                <Link
                                                    href={`/contest/${contest.id}`}
                                                >
                                                    {t("profile.viewContest") || "View"}
                                                </Link>
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
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

function CrownIcon(props: React.ComponentProps<"svg">) {
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
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    );
}

function EnvelopeIcon(props: React.ComponentProps<"svg">) {
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
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}
