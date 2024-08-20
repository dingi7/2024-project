import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useToast } from "../ui/use-toast";

function SignOutButton({
  classProp,
  children,
}: {
  classProp: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Link
      href="#"
      className={classProp}
      onClick={async (e) => {
        e.preventDefault();
        await signOut({ redirect: false });
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
          variant: "success",
        });
        router.push("/");
      }}
    >
      {children}
      <span>Logout</span>
    </Link>
  );
}

export default SignOutButton;
