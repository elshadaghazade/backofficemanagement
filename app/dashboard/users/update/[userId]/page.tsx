'use client';

import PageWrapper from "@/app/components/PageWrapper";
import { useLazyGetUserQuery, useUpdateUserMutation } from "@/store/api/userApi";
import { useState, type FC, useEffect } from "react";
import { Button, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { UserStatus } from "@/lib/generated/prisma/enums";

const UserUpdate: FC = () => {
    const router = useRouter();
    const { userId } = useParams<{ userId: string }>();

    const [getUser, { isLoading: isUserLoading, data: userData }] = useLazyGetUserQuery();
    const [updateUser, { isLoading, isError, error }] = useUpdateUserMutation();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<UserStatus>()

    useEffect(() => {
        if (!userId) {
            return;
        }

        getUser(userId);
    }, [userId]);

    useEffect(() => {
        if (userData) {
            const user = userData.user;
            setFirstName(user.firstName ?? '');
            setLastName(user.lastName ?? '');
            setEmail(user.email ?? '');
            setStatus(user.status ?? 'active')
        }
    }, [userData]);

    const serverErrors = isError && error
        ? {
            form: "data" in (error as object)
                ? (error as { data: { error: string } }).data.error
                : "Something went wrong. Please try again."
        }
        : undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const updateData: Record<string, string> = { firstName, lastName, email, status: status ?? 'active' };
        if (password) {
            updateData.password = password;
        }

        try {
            await updateUser({ userId, data: updateData }).unwrap();
            router.push("/dashboard/users");
        } catch { }
    };

    return (
        <PageWrapper>
            <div className="max-w-lg mx-auto py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard/users"
                        className="text-sm text-default-500 hover:text-default-700 inline-flex items-center gap-1 mb-4 transition-colors"
                    >
                        &laquo; Back to Users
                    </Link>
                    <h1 className="text-xl font-semibold text-foreground">Edit User</h1>
                    <p className="text-sm text-default-500 mt-1">
                        Update the user's information.
                    </p>
                </div>

                {serverErrors?.form && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger">
                        {serverErrors.form}
                    </div>
                )}

                {isUserLoading ? (
                    <p className="text-sm text-default-500">Loading user...</p>
                ) : (
                    <Form
                        onSubmit={handleSubmit}
                        validationBehavior="native"
                        className="flex flex-col gap-4"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <TextField className="w-full" name="firstName" type="text">
                                <Label>First name</Label>
                                <Input
                                    disabled={status === 'inactive'}
                                    name="firstName"
                                    placeholder="John"
                                    required
                                    minLength={1}
                                    variant="primary"
                                    value={firstName}
                                    onChange={e => setFirstName(e.currentTarget.value)}
                                />
                            </TextField>
                            <TextField className="w-full" name="lastName" type="text">
                                <Label>Last name</Label>
                                <Input
                                    disabled={status === 'inactive'}
                                    name="lastName"
                                    placeholder="Doe"
                                    required
                                    minLength={1}
                                    variant="primary"
                                    value={lastName}
                                    onChange={e => setLastName(e.currentTarget.value)}
                                />
                            </TextField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <TextField className="w-full" name="email" type="email">
                                <Label>Email</Label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    variant="primary"
                                    value={email}
                                    onChange={e => setEmail(e.currentTarget.value)}
                                />
                            </TextField>

                            <TextField className="w-full" name="password" type="password">
                                <Label>
                                    Password{" "}
                                    <span className="text-default-400 font-normal text-xs">(leave blank to keep current)</span>
                                </Label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="New password"
                                    minLength={8}
                                    variant="primary"
                                    value={password}
                                    onChange={e => setPassword(e.currentTarget.value)}
                                />
                            </TextField>
                        </div>

                        <Select value={status} className="w-[256px]" placeholder="Select one" onChange={key => setStatus(key as any)}>
                            <Label>Status</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    <ListBox.Item id="active" textValue="Active">
                                        Active
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                    <ListBox.Item id="inactive" textValue="Inactive">
                                        inactive
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                </ListBox>
                            </Select.Popover>
                        </Select>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                onClick={() => router.push("/dashboard/users")}
                                variant="primary"
                                className="text-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isDisabled={isLoading}
                                className="text-sm"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </Form>
                )}

            </div>
        </PageWrapper>
    );
};

export default UserUpdate;