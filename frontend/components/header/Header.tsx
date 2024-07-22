"use client";

import { CodeIcon, MenuIcon, XIcon } from "lucide-react"; // Ensure you have the MenuIcon and XIcon
import Link from "next/link";
import React, { useState } from "react";
import ProfileAvatar from "./Avatar";
import SignOutButton from "./SignOutButton";

type Props = {};

function Header({}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-primary text-primary-foreground relative">
      <div className="flex items-center justify-between w-full lg:w-auto">
        <Link href="/" className="flex items-center" prefetch={false}>
          <CodeIcon className="h-6 w-6 mx-auto" />
          <span className="sr-only">Contestify</span>
        </Link>
        <button className="lg:hidden ml-auto" onClick={toggleMenu}>
          {menuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      <nav
        className={`lg:flex gap-4 sm:gap-6 ${
          menuOpen ? "flex z-50" : "hidden"
        } flex-col lg:flex-row absolute lg:relative top-14 left-0 lg:top-0 lg:left-0 w-full lg:w-auto bg-primary lg:bg-transparent p-4 lg:p-0 lg:items-center`}
      >
        <Link
          href="/contests"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          Explore Contests
        </Link>
        <Link
          href="#"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          Compete
        </Link>
        <Link
          href="#"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          Leaderboard
        </Link>
        <div className="lg:hidden flex flex-col gap-4 sm:gap-6">
          <Link
            href="/profile"
            className="text-sm font-bold hover:underline underline-offset-4"
            prefetch={false}
          >
            Profile
          </Link>
          <SignOutButton classProp="text-sm font-bold hover:underline underline-offset-4" />
        </div>
      </nav>

      <nav className="hidden lg:flex gap-4">
        <ProfileAvatar />
      </nav>
    </header>
  );
}

export default Header;
