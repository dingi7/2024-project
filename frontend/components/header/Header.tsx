"use client";

import { CodeIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import ProfileAvatar from "./Avatar";
import SignOutButton from "./SignOutButton";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "./ModeToggle";

type Props = {};

function Header({}: Props) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const menuVariants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-primary text-primary-foreground relative dark:bg-black dark:text-foreground">
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

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-4 sm:gap-6 items-center">
        <Link
          href="/contests"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          Explore Contests
        </Link>
        <Link
          href="/leaderboard"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          Leaderboard
        </Link>
      </nav>
      <div className="lg:flex gap-4 flex sm:hidden">
        <ModeToggle />
        <ProfileAvatar />
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.3 }}
            className="lg:hidden flex flex-col gap-4 sm:gap-6 absolute top-14 left-0 w-full bg-primary p-4 z-50"
          >
            <Link
              href="/contests"
              className="text-sm font-bold hover:underline underline-offset-4"
              prefetch={false}
              onClick={closeMenu}
            >
              Explore Contests
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-bold hover:underline underline-offset-4"
              prefetch={false}
              onClick={closeMenu}
            >
              Leaderboard
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-bold hover:underline underline-offset-4"
                  prefetch={false}
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                <SignOutButton classProp="text-sm font-bold hover:underline underline-offset-4" />
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-bold hover:underline underline-offset-4"
                prefetch={false}
                onClick={closeMenu}
              >
                Login
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
