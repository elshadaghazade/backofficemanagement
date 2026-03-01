'use client';

import PageWrapper from "@/app/components/PageWrapper";
import { useCreateSessionMutation, useLazyUsersListQuery, useRemoveUserMutation } from "@/store/api/userApi";
import { type FC, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./style.module.css";
import type { UserType } from "@/lib/validators/user-list";
import { Button, Modal } from "@heroui/react";

const STATUS_CLASS: Record<string, string> = {
    active: styles.statusActive,
    inactive: styles.statusInactive,
    blocked: styles.statusBlocked,
};

const UserManagement: FC = () => {
    const [page, setPage] = useState(0);
    const [getUsers, { isLoading, data }] = useLazyUsersListQuery();
    const [removeUser, { isSuccess: removeDone }] = useRemoveUserMutation();
    const [isOpen, setIsOpen] = useState(false);

    const [createSession, {
        data: newSessionData,
        isLoading: sessionIsCreating
    }] = useCreateSessionMutation();

    useEffect(() => {
        getUsers({ page });
    }, [page]);

    const users: UserType[] = data?.data ?? [];

    const onDeleteUser = useCallback((user: UserType) => {
        if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
            return;
        }

        removeUser(user.id);
    }, []);

    useEffect(() => {
        if (!removeDone) {
            return;
        }

        getUsers({ page });
    }, [removeDone, page]);

    const onCreateSession = useCallback((user: UserType) => {
        createSession(user.id);
    }, [createSession]);

    useEffect(() => {
        if (!newSessionData) {
            return;
        }

        setIsOpen(true);
    }, [newSessionData]);

    return (
        <PageWrapper>
            <div className={styles.root}>

                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Users</h1>
                        {data && (
                            <p className={styles.subtitle}>{data.totalUsers} total users</p>
                        )}
                    </div>
                    <Link href="/dashboard/users/create" className={`${styles.btn} ${styles.btnPrimary}`}>
                        + Create User
                    </Link>
                </div>

                <div className={styles.tableWrap}>
                    {isLoading ? (
                        <div className={styles.state}>Loading...</div>
                    ) : users.length === 0 ? (
                        <div className={styles.state}>No users found.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Logins</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className={styles.nameCell}>
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className={styles.muted}>{user.email}</td>
                                        <td>
                                            <span className={styles.badge}>{user.role ?? '—'}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${STATUS_CLASS[user.status] ?? ''}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className={styles.muted}>{user.loginsCount}</td>
                                        <td className={styles.muted}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <Link
                                                    href={sessionIsCreating ? '' : `/dashboard/users/update/${user.id}`}
                                                    className={styles.link}
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    className={`${styles.link} ${styles.linkDanger}`}
                                                    onClick={() => onDeleteUser(user)}
                                                    disabled={sessionIsCreating}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className={`${styles.link} ${styles.linkDanger}`}
                                                    onClick={() => onCreateSession(user)}
                                                    disabled={sessionIsCreating}
                                                >
                                                    Start Session
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {data && data.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={`${styles.btn} ${styles.btnGhost}`}
                            disabled={!page}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            &laquo; Previous
                        </button>
                        <div className={styles.pages}>
                            {Array.from({ length: data.totalPages }, (_, i) => i).map((p) => (
                                <button
                                    key={p}
                                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            className={`${styles.btn} ${styles.btnGhost}`}
                            disabled={!data.nextPage}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next &raquo;
                        </button>
                    </div>
                )}

            </div>

            <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
                <Modal.Container>
                    <Modal.Dialog className="sm:max-w-[360px]">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>NEW SESSION</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <p>
                                http://localhost:3000/start/{newSessionData?.sessionId}
                            </p>
                            <p>
                                <Link href={'/dashboard/users/sessions'}>See all sessions</Link>
                            </p>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </PageWrapper>
    );
};

export default UserManagement;