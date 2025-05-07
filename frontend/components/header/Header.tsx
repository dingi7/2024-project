"use client";

import { CodeIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import ProfileAvatar from "./Avatar";
import SignOutButton from "./SignOutButton";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "./ModeToggle";
import LanguageToggle from "./LanguageToggle";
import InvitationsPopup from "./InvitationsPopup";
import { useTranslation } from "@/lib/useTranslation";
import { useInvitationStore } from "@/lib/stores/invitationStore";

type Props = {};

function Header({}: Props) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { fetchInvitations } = useInvitationStore();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Initial fetch of invitations when user logs in
  useEffect(() => {
    if (session?.user) {
      fetchInvitations();
    }
  }, [session?.user, fetchInvitations]);

  const menuVariants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <header className="px-4 lg:px-6 h-14 z-40 flex items-center justify-between bg-primary text-primary-foreground relative dark:bg-black dark:text-foreground">
      <div className="flex items-center">
        <Link href="/" className="flex items-center" prefetch={false}>
          <CodeIcon className="h-6 w-6 mx-auto" />
          <span className="sr-only">Contestify</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-4 sm:gap-6 items-center absolute left-1/2 transform -translate-x-1/2">
        <Link
          href="/contests"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          {t("header.exploreContests")}
        </Link>
        <Link
          href="/leaderboard"
          className="text-sm font-bold hover:underline underline-offset-4"
          prefetch={false}
        >
          {t("header.leaderboard")}
        </Link>
        {session?.user && session.role === "admin" && (
          <Link
            href="/contest/create"
            className="text-sm font-bold hover:underline underline-offset-4"
            prefetch={false}
          >
            {t("header.create")}
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        <LanguageToggle />
        <ModeToggle />
        {session?.user && <InvitationsPopup />}
        <ProfileAvatar />
        <button className="lg:hidden" onClick={toggleMenu}>
          {menuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
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
              {t("header.exploreContests")}
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-bold hover:underline underline-offset-4"
              prefetch={false}
              onClick={closeMenu}
            >
              {t("header.leaderboard")}
            </Link>
            {session?.user && session.role === "admin" ? (
              <>
                <Link
                  href="/contest/create"
                  className="text-sm font-bold hover:underline underline-offset-4"
                  prefetch={false}
                  onClick={closeMenu}
                >
                  {t("header.create")}
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-bold hover:underline underline-offset-4"
                  prefetch={false}
                  onClick={closeMenu}
                >
                  {t("header.profile")}
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
                {t("header.login")}
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
