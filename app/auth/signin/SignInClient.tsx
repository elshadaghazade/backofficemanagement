'use client';

import { z } from 'zod';
import { useState, useEffect, type FC, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Button,
    Card,
    Form,
    Input,
    Label,
    TextField,
    Alert,
    Spinner
} from '@heroui/react';
import { useSignInMutation } from '@/store/api/authApi';
import { setAccessToken } from '@/lib/axiosBaseQuery';
import { SignInSchema } from '@/lib/validators/signin';
import Footer from '@/app/components/Footer';
import Logo from '@/app/components/Logo';
import AuthCardHeader from '@/app/components/AuthCardHeader';
import ErrorMessages from '@/app/components/ErrorMessages';
import PageWrapper from '@/app/components/PageWrapper';

interface FormState {
    email: string;
    password: string;
}

const validate = async (values: FormState) => {
    const parsed = await SignInSchema.safeParse(values);

    if (!parsed.success) {
        return z.flattenError(parsed.error).fieldErrors;
    }
}

const SignInClient: FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') ?? '/';

    const [signIn, { isLoading }] = useSignInMutation();

    const [values, setValues] = useState<FormState>({ email: '', password: '' });

    const [fieldErrors, setFieldErrors] = useState<{
        email?: string[],
        password?: string[]
    }>({});

    const [serverError, setServerError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

    useEffect(() => {

        (async () => {
            if (Object.keys(touched).length === 0) return;
            const errors = await validate(values);
            const relevantErrors: typeof fieldErrors = {};

            (Object.keys(touched) as (keyof FormState)[]).forEach((key) => {
                if (errors?.[key]?.length) {
                    relevantErrors[key] = errors[key];
                }
            });

            setFieldErrors(relevantErrors);
        })();

    }, [values, touched]);

    const handleChange = useCallback((field: keyof FormState) => {
        return (value: string) => {
            setValues((prev) => ({ ...prev, [field]: value }));
            setServerError(null);
        };
    }, []);

    const handleBlur = useCallback((field: keyof FormState) => {
        return () => setTouched((prev) => ({ ...prev, [field]: true }));
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setTouched({ email: true, password: true });

        const errors = await validate(values);

        const _fieldErrors: typeof fieldErrors = {};
        if (errors?.email?.length) {
            _fieldErrors.email = errors.email;
        }

        if (errors?.password?.length) {
            _fieldErrors.password = errors.password;
        }

        if (Object.keys(_fieldErrors).length) {
            setFieldErrors(_fieldErrors);
            return;
        }

        setFieldErrors({});
        setServerError(null);

        try {
            const result = await signIn({
                email: values.email.trim().toLowerCase(),
                password: values.password,
            }).unwrap();

            setAccessToken(result.accessToken);

            router.push(callbackUrl);
            router.refresh();

        } catch (err: any) {
            const message = err?.data?.message ?? err?.data?.error ?? 'invalid email or password. try again!';
            setServerError(message);
        }
    }

    return (
        <PageWrapper
            logo={<Logo breadcrumb />}
        >

            <Card className="w-full border bg-content3 bg-content2 backdrop-blur-sm shadow-2xl">
                <AuthCardHeader
                    title='Welcome back'
                    description='Sign in to your account to continue'
                />

                <Form onSubmit={handleSubmit}>
                    <Card.Content className="flex flex-col gap-5 pt-4">

                        {serverError && (
                            <Alert status='danger'>
                                <Alert.Description>{serverError}</Alert.Description>
                            </Alert>
                        )}

                        <TextField
                            name="email"
                            type="email"
                            value={values.email}
                            onChange={handleChange('email')}
                            onBlur={handleBlur('email')}
                            isInvalid={!!fieldErrors.email?.length}
                            isDisabled={isLoading}
                            fullWidth
                        >
                            <Label className="text-foreground-secondary text-sm">Email address</Label>
                            <Input
                                placeholder="youremail@example.com"
                                variant="secondary"
                                className="bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                               focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
                            />
                            <ErrorMessages messages={fieldErrors.email} />
                        </TextField>

                        <TextField
                            name="password"
                            type="password"
                            value={values.password}
                            onChange={handleChange('password')}
                            onBlur={handleBlur('password')}
                            isInvalid={!!fieldErrors.password?.length}
                            isDisabled={isLoading}
                            fullWidth
                        >
                            <div className="flex items-center justify-between">
                                <Label className="text-foreground-secondary text-sm">Password</Label>
                            </div>
                            <Input
                                placeholder="Your password"
                                variant="secondary"
                                className="bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                               focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
                            />
                            <ErrorMessages messages={fieldErrors.password} />
                        </TextField>

                    </Card.Content>

                    <Card.Footer className="flex flex-col gap-4 pt-2 pb-6">
                        <Button
                            type="submit"
                            fullWidth
                            isDisabled={isLoading}
                            className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                           text-foreground font-medium h-11 rounded-xl transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Spinner size="sm" className="text-white/70" />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </Button>

                        <p className="text-center text-sm text-foreground-tertiary">
                            Don't have an account?{' '}
                            <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Create one
                            </Link>
                        </p>
                    </Card.Footer>
                </Form>
            </Card>

        </PageWrapper>
    );
}

export default memo(SignInClient);