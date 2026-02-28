'use client';

import { useLazyMeQuery } from "@/store/api/authApi";
import { useEffect } from "react";
import PageWrapper from "@/app/components/PageWrapper";
import Dashboard from "@/app/components/Dashboard";

export default function Home() {

  const [getMe, { data, isLoading: userInfoLoading }] = useLazyMeQuery();

  useEffect(() => {
    getMe();
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-[300px] flex flex-wrap items-center justify-center">
        {data?.userInfo && !userInfoLoading ? <Dashboard userInfo={data.userInfo} /> : <h1>Loading...</h1>}
      </div>
    </PageWrapper>
  );
}
