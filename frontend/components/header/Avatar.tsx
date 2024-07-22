import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";

type Props = {};

function ProfileAvatar({}: Props) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link
        href="/login"
        prefetch={false}
        className="text-sm font-bold hover:underline underline-offset-4"
      >
        Login
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 shadow-md">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>JP</AvatarFallback>
          <span className="sr-only">Toggle user menu</span>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-50">
        <DropdownMenuItem>
          <Link href="/profile" className="flex items-center gap-2" prefetch={false}>
            <div className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOutButton classProp="flex items-center gap-2">
            <div className="h-4 w-4" />
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileAvatar;
