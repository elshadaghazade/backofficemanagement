'use client';

import { type FC, type ReactEventHandler, useCallback, useEffect } from "react";
import type { AuthMeResponseType } from "@/app/api/auth/me/route";
import { useSignOutMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { useLazyGetContentQuery } from "@/store/api/dashboardApi";
import ContentEditor from "./ContentEditor";
import Link from "next/link";

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
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, {userInfo.firstName} {userInfo.lastName}</h1>
          <p className="dashboard-subtitle">
            Role: <span className="role-badge">{userInfo.role}</span>
          </p>
        </div>
        <button className="btn btn-ghost" onClick={logOutHandler}>
          Sign out
        </button>
      </div>

      {userInfo.role === 'admin' && (
        <nav className="dashboard-nav">
          <Link href="/dashboard/users" className="nav-card">
            <span className="nav-card-title">Users</span>
            <span className="nav-card-desc">List, edit and delete users</span>
          </Link>
          <Link href="/dashboard/users/sessions" className="nav-card">
            <span className="nav-card-title">Sessions</span>
            <span className="nav-card-desc">List and delete user sessions</span>
          </Link>
          <Link href="/dashboard/users/create" className="nav-card">
            <span className="nav-card-title">Create User</span>
            <span className="nav-card-desc">Add a new user to the platform</span>
          </Link>
        </nav>
      )}

      <div className="dashboard-section">
        {content?.content && userInfo.role === 'user' ? (
          <div
            className="content-body"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        ) : userInfo.role === 'admin' ? (
          <ContentEditor
            content={content?.content ?? ''}
            key={content?.content ?? 'empty-content-editor'}
          />
        ) : (
          <p className="content-empty">No content published yet.</p>
        )}
      </div>

      <style>{`
        .dashboard {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .dashboard-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 6px;
        }
        .dashboard-subtitle {
          font-size: 14px;
          margin: 0;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .role-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        /* Buttons */
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.15s;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }
        .btn-ghost {
          background: transparent;
          border-color: #d1d5db;
          color: inherit;
        }
        .btn-ghost:hover { background: rgba(0,0,0,0.05); }

        /* Nav cards */
        .dashboard-nav {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .nav-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, background 0.15s;
        }
        .nav-card:hover {
          border-color: #9ca3af;
          background: rgba(0,0,0,0.02);
        }
        .nav-card-title {
          font-size: 14px;
          font-weight: 600;
        }
        .nav-card-desc {
          font-size: 12px;
          color: #6b7280;
        }

        /* Content section */
        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .content-body {
          font-size: 14px;
          line-height: 1.6;
        }
        .content-empty {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .btn-ghost { border-color: #374151; }
          .btn-ghost:hover { background: rgba(255,255,255,0.05); }
          .role-badge { background: #1f2937; border-color: #374151; color: #d1d5db; }
          .nav-card { border-color: #374151; }
          .nav-card:hover { border-color: #6b7280; background: rgba(255,255,255,0.03); }
          .nav-card-desc { color: #9ca3af; }
          .section-title { border-color: #374151; }
          .dashboard-subtitle { color: #9ca3af; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;