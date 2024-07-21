import { signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";

function SignOutButton({ classProp, children }: { classProp: string, children?: React.ReactNode }) {
  return (
    <Link
      href="#"
      className={classProp}
      onClick={async (e) => {
        e.preventDefault();
        await signOut();
      }}
    >
      {children}
      <span>Logout</span>
    </Link>
  );
}

export default SignOutButton;
