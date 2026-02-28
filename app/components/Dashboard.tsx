import { type FC, memo, type ReactEventHandler, useCallback, useEffect } from "react";
import type { AuthMeResponseType } from "@/app/api/auth/me/route";
import { useSignOutMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

interface DashboardPropsType {
  userInfo: AuthMeResponseType['userInfo']
}

const Dashboard: FC<DashboardPropsType> = ({ userInfo }) => {
  
  const [signOut, { isSuccess: logOutSuccess }] = useSignOutMutation();
  const router = useRouter();

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
    </>
  );
}

export default memo(Dashboard);