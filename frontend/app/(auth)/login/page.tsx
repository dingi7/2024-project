"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JSX, SVGProps } from "react";
import { signIn, useSession } from "next-auth/react";
import { GithubIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default function Component() {

	const { data: session } = useSession();

	if (session) {
		// If session exists, redirect to home page
		redirect("/");
	}

  return (
    <div className="flex items-center justify-center flex-1 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-sm rounded-lg shadow-lg bg-white dark:bg-gray-900 p-6 space-y-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Login
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Login to your with your github account to continue
          </p>
        </div>
        <Button
          className="w-full bg-[#333] text-white flex items-center justify-center"
          onClick={async () => {
            await signIn("github");
          }}
        >
          <GithubIcon className="w-5 h-5 mr-2" />
          Login with GitHub
        </Button>
      </div>
    </div>
  );
}