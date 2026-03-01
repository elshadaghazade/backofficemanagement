'use client';

import { type FC, type ReactEventHandler, useCallback, useEffect } from "react";
import type { AuthMeResponseType } from "@/app/api/auth/me/route";
import { useSignOutMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { useLazyGetContentQuery } from "@/store/api/dashboardApi";
import ContentEditor from "../ContentEditor";
import Link from "next/link";
import style from './style.module.css';

interface DashboardPropsType {
  userInfo: AuthMeResponseType['userInfo']
}

const Dashboard: FC<DashboardPropsType> = ({ userInfo }) => {
  const [signOut, { isSuccess: logOutSuccess }] = useSignOutMutation();
  const [getContent, { data: content }] = useLazyGetContentQuery();
  const router = useRouter();

  useEffect(() => { getContent(); }, []);

  useEffect(() => {
    if (!logOutSuccess) return;
    router.refresh();
  }, [logOutSuccess, router]);

  const logOutHandler: ReactEventHandler = useCallback((e) => {
    e.preventDefault();
    signOut();
  }, [signOut]);

  return (
    <div className={style["dashboard"]}>
      <div className={style["dashboard-header"]}>
        <div>
          <h1 className={style["dashboard-title"]}>Welcome, {userInfo.firstName} {userInfo.lastName}</h1>
          <p className={style["dashboard-subtitle"]}>
            Role: <span className={style["role-badge"]}>{userInfo.role}</span>
          </p>
        </div>
        <button className={`${style["btn"]} ${style["btn-ghost"]}`} onClick={logOutHandler}>
          Sign out
        </button>
      </div>

      {userInfo.role === 'admin' && (
        <nav className={style["dashboard-nav"]}>
          <Link href="/dashboard/users" className={style["nav-card"]}>
            <span className={style["nav-card-title"]}>Users</span>
            <span className={style["nav-card-desc"]}>List, edit and delete users</span>
          </Link>
          <Link href="/dashboard/users/sessions" className={style["nav-card"]}>
            <span className={style["nav-card-title"]}>Sessions</span>
            <span className={style["nav-card-desc"]}>List and delete user sessions</span>
          </Link>
          <Link href="/dashboard/users/create" className={style["nav-card"]}>
            <span className={style["nav-card-title"]}>Create User</span>
            <span className={style["nav-card-desc"]}>Add a new user to the platform</span>
          </Link>
        </nav>
      )}

      <div className={style["dashboard-section"]}>
        {content?.content && userInfo.role === 'user' ? (
          <div
            className={style["content-body"]}
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        ) : userInfo.role === 'admin' ? (
          <ContentEditor
            content={content?.content ?? ''}
            key={content?.content ?? 'empty-content-editor'}
          />
        ) : (
          <p className={style["content-empty"]}>No content published yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;