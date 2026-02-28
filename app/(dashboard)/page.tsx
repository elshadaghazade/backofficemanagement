'use client';

import { useSignOutMutation } from "@/store/api/authApi";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ReactEventHandler, useCallback, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";

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
    <PageWrapper>
      <div className="min-h-[300px] flex flex-wrap items-center justify-center">
        <h1>Welcome, <Button onClick={logOutHandler}>Log out</Button></h1>
      </div>
    </PageWrapper>
  );
}
