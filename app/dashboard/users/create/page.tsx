'use client';

import PageWrapper from "@/app/components/PageWrapper";
import { useCreateUserMutation } from "@/store/api/userApi";
import { useState, type FC } from "react";
import { Button, ErrorMessage, Form, Input, Label, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const UserCreate: FC = () => {
    const router = useRouter();
    const [createUser, { isLoading, isError, error }] = useCreateUserMutation();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const serverErrors = isError && error
        ? {
            form: "data" in (error as object)
                ? (error as { data: { error: string }}).data.error
                : "Something went wrong. Please try again."
        }
        : undefined;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await createUser({
                firstName,
                lastName,
                email,
                password
            }).unwrap();
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
                    <h1 className="text-xl font-semibold text-foreground">Create User</h1>
                    <p className="text-sm text-default-500 mt-1">
                        Add a new user to the platform.
                    </p>
                </div>

                {serverErrors?.form && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger">
                        {serverErrors.form}
                    </div>
                )}

                <Form
                    onSubmit={handleSubmit}
                    validationBehavior="native"
                    className="flex flex-col gap-4"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <TextField className="w-full max-w-64" name="email" type="text">
                            <Label>First name</Label>
                            <Input
                                name="firstName"
                                placeholder="John"
                                required
                                minLength={1}
                                variant="primary"
                                value={firstName}
                                onChange={e => setFirstName(e.currentTarget.value)}
                            />
                        </TextField>
                        <TextField className="w-full max-w-64" name="email" type="text">
                            <Label>Last name</Label>
                            <Input
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

                    <TextField className="w-full max-w-64" name="email" type="email">
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

                    <TextField className="w-full max-w-64" name="email" type="password">
                        <Label>Password</Label>
                        <Input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            variant="primary"
                            value={password}
                            onChange={e => setPassword(e.currentTarget.value)}
                        />
                    </TextField>

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
                            {isLoading ? "Creating..." : "Create User"}
                        </Button>
                    </div>
                </Form>

            </div>
        </PageWrapper>
    );
};

export default UserCreate;