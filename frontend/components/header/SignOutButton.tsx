import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

function SignOutButton({
  classProp,
  children,
}: {
  classProp: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href="#"
      className={classProp}
      onClick={async (e) => {
        e.preventDefault();
        await signOut({ redirect: false });
        router.push("/");  
      }}
    >
      {children}
      <span>Logout</span>
    </Link>
  );
}

export default SignOutButton;
