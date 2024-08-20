"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { GithubIcon } from "lucide-react";

export default function Component() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full rounded-xl shadow-2xl bg-white dark:bg-gray-800 p-8 space-y-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-3xl">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Login with your GitHub account to continue
          </p>
        </div>
        <Button
          className="w-full bg-gray-900 hover:bg-slate-950 text-white text-lg font-semibold py-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
          onClick={async () => {
            await signIn("github", {callbackUrl: "/"});
          }}
        >
          <GithubIcon className="w-7 h-7 mr-3" />
          Login with GitHub
        </Button>
      </div>
    </div>
  );
}