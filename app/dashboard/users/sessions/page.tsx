'use client';

import PageWrapper from "@/app/components/PageWrapper";
import { useLazySessionsQuery, useTerminateSessionMutation } from "@/store/api/userApi";
import { type FC, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SessionType } from "@/lib/validators/user-session-list";
import { Button } from "@heroui/react";
import Logo from "@/app/components/Logo";

const UserSessions: FC = () => {
    const [page, setPage] = useState(0);
    const [getSessions, { isLoading, data }] = useLazySessionsQuery();
    const [terminatingIds, setTerminatingIds] = useState<Set<string>>(new Set());
    const [terminateError, setTerminateError] = useState<string | null>(null);

    const [sessionTerminate] = useTerminateSessionMutation();

    useEffect(() => {
        getSessions({ page });
    }, [page]);

    const terminateSession = useCallback(async (sessionId: string) => {
        setTerminateError(null);
        setTerminatingIds(prev => new Set(prev).add(sessionId));
        try {
            await sessionTerminate(sessionId).unwrap();
            getSessions({ page });
        } catch (err) {
            const message =
                err && typeof err === 'object' && 'data' in err
                    ? (err as { data: { error: string } }).data.error
                    : "Failed to terminate session. Please try again.";
            setTerminateError(message);
        } finally {
            setTerminatingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
    }, [sessionTerminate, getSessions, page]);

    const sessions: SessionType[] = data?.data ?? [];

    return (
        <PageWrapper
            logo={<Logo breadcrumb />}
        >
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard/users"
                        className="text-sm text-default-500 hover:text-default-700 inline-flex items-center gap-1 mb-4 transition-colors"
                    >
                        &laquo; Back to Users
                    </Link>
                    <h1 className="text-xl font-semibold text-foreground">User Sessions</h1>
                    {data && (
                        <p className="text-sm text-default-500 mt-1">
                            {data.totalUsers} total sessions
                        </p>
                    )}
                </div>

                {terminateError && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger flex items-center justify-between">
                        <span>{terminateError}</span>
                        <button
                            onClick={() => setTerminateError(null)}
                            className="text-danger hover:opacity-70 transition-opacity ml-4 text-base leading-none"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <div className="border border-divider rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="py-16 text-center text-sm text-default-400">
                            Loading...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="py-16 text-center text-sm text-default-400">
                            No sessions found.
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-default-50 border-b border-divider">
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">Session ID</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">Started</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">Terminated</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-default-500"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => {
                                    const isTerminating = terminatingIds.has(session.id);
                                    return (
                                        <tr key={session.id} className="border-b border-divider last:border-0 hover:bg-default-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">
                                                    {session.user.firstName} {session.user.lastName}
                                                </div>
                                                <div className="text-xs text-default-400">{session.user.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-default-500 font-mono text-xs">
                                                {session.id.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-default-500">
                                                {new Date(session.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-default-500">
                                                {session.terminatedAt
                                                    ? new Date(session.terminatedAt).toLocaleString()
                                                    : <span className="text-default-300">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                {session.terminatedAt ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-default-100 text-default-500">
                                                        Ended
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-600">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {!session.terminatedAt && (
                                                    <Button
                                                        variant="danger"
                                                        isDisabled={isTerminating}
                                                        onClick={() => terminateSession(session.id)}
                                                    >
                                                        {isTerminating ? 'Terminating...' : 'Terminate'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <button
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-divider text-default-600 hover:bg-default-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            disabled={!page}
                            onClick={() => setPage(p => p - 1)}
                        >
                            &laquo; Previous
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: data.totalPages }, (_, i) => i).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors
                                        ${p === page
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'border-divider text-default-600 hover:bg-default-100'
                                        }`}
                                >
                                    {p + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-divider text-default-600 hover:bg-default-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            disabled={!data.nextPage}
                            onClick={() => setPage(p => p)}
                        >
                            Next &raquo;
                        </button>
                    </div>
                )}

            </div>
        </PageWrapper>
    );
};

export default UserSessions;