'use client';

import { useSignOutMutation } from "@/store/api/authApi";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ReactEventHandler, useCallback, useEffect } from "react";

export default function Home() {

  const [signOut, { isSuccess }] = useSignOutMutation();
  const router = useRouter();

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    router.refresh();

  }, [isSuccess, router]);

  const logOutHandler: ReactEventHandler = useCallback((e) => {
    e.preventDefault();

    signOut();
  }, []);

  return (
    <h1>Welcome, <Button onClick={logOutHandler}>Log out</Button></h1>
  );
}
