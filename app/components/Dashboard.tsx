'use client';

import { type FC, type ReactEventHandler, useCallback, useEffect } from "react";
import type { AuthMeResponseType } from "@/app/api/auth/me/route";
import { useSignOutMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useLazyGetContentQuery } from "@/store/api/dashboardApi";
import ContentEditor from "./ContentEditor";

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

      {content?.content && userInfo.role === 'user' ? (
        <div dangerouslySetInnerHTML={{__html: content.content }} />
       ) : (userInfo.role === 'admin' ? (
       <ContentEditor content={content?.content ?? ''} />
       ) : '')}
    </>
  );
}

export default Dashboard;