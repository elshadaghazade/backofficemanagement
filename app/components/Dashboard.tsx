'use client';

import { type FC, memo, type ReactEventHandler, useCallback, useEffect } from "react";
import type { AuthMeResponseType } from "@/app/api/auth/me/route";
import { useSignOutMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useGetContentQuery, useLazyGetContentQuery } from "@/store/api/dashboardApi";

interface DashboardPropsType {
  userInfo: AuthMeResponseType['userInfo']
}

const Dashboard: FC<DashboardPropsType> = ({ userInfo }) => {
  
  const [signOut, { isSuccess: logOutSuccess }] = useSignOutMutation();
  const [getContent, { data: content }] = useLazyGetContentQuery();
  const router = useRouter();

  useEffect(() => {
    getContent();
  }, []);

  useEffect(() => {
    if (!logOutSuccess) {
      return;
    }
    router.refresh();
  }, [logOutSuccess, router]);

  const logOutHandler: ReactEventHandler = useCallback((e) => {
    e.preventDefault();

    signOut();
  }, []);

  return (
    <>
      <h1>Welcome {userInfo.firstName} {userInfo.lastName}, <Button onClick={logOutHandler}>Log out</Button></h1>

      {content?.content ? <div dangerouslySetInnerHTML={{__html: content.content }} /> : ''}
    </>
  );
}

export default Dashboard;