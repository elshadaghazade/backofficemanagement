'use client';

import { z } from 'zod';
import { useState, useEffect, type FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { useSignUpMutation } from '@/store/api/authApi';
import { setAccessToken } from '@/lib/axiosBaseQuery';
import { SignUpWithConfirmSchema } from '@/lib/validators/signup';
import { getPasswordStrength } from '@/lib/validators/password';
import Footer from '@/app/components/Footer';
import Logo from '@/app/components/Logo';
import AuthCardHeader from '@/app/components/AuthCardHeader';
import ErrorMessages from '@/app/components/ErrorMessages';
import PageWrapper from '@/app/components/PageWrapper';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const validate = async (values: FormState) => {
  const parsed = await SignUpWithConfirmSchema.safeParse(values);

  if (!parsed.success) {
    return z.flattenError(parsed.error).fieldErrors;
  }
}

const SignUpPage: FC = () => {
  const router = useRouter();
  const [signUp, { isLoading }] = useSignUpMutation();

  const [values, setValues] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const strength = getPasswordStrength(values.password);

  useEffect(() => {
    (async () => {
      if (Object.keys(touched).length === 0) {
        return;
      }

      const errors = await validate(values);
      const relevant: typeof errors = {};
      (Object.keys(touched) as (keyof FormState)[]).forEach((key) => {
        if (errors?.[key]?.length) {
          relevant[key] = errors[key];
        }
      });
      setFieldErrors(relevant);
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

    const allTouched = Object.fromEntries(
      (Object.keys(values) as (keyof FormState)[]).map((k) => [k, true]),
    );

    setTouched(allTouched);

    const errors = await validate(values);
    const _fieldErrors: typeof errors = {};

    if (errors?.confirmPassword?.length) {
      _fieldErrors.confirmPassword = errors.confirmPassword;
    }

    if (errors?.email?.length) {
      _fieldErrors.email = errors.email;
    }

    if (errors?.firstName?.length) {
      _fieldErrors.firstName = errors.firstName;
    }

    if (errors?.lastName?.length) {
      _fieldErrors.lastName = errors.lastName;
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
      const result = await signUp({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      setAccessToken(result.accessToken);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      const message = err?.data?.message ?? err?.data?.error ?? 'something is wrong. try again!';
      setServerError(message);
    }
  }

  return (
    <PageWrapper>

      <Card className="w-full border bg-content3 bg-content2 backdrop-blur-sm shadow-2xl">
        <AuthCardHeader
          title='Create an account'
          description='Get started - it only takes a minute'
        />

        <Form onSubmit={handleSubmit}>
          <Card.Content className="flex flex-col gap-5 pt-4">

            {serverError && (
              <Alert status="danger">
                <Alert.Description>{serverError}</Alert.Description>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <TextField
                name="firstName"
                value={values.firstName}
                onChange={handleChange('firstName')}
                onBlur={handleBlur('firstName')}
                isInvalid={!!fieldErrors.firstName}
                isDisabled={isLoading}
                fullWidth
              >
                <Label className="text-foreground-secondary text-sm">First name</Label>
                <Input
                  placeholder="Jane"
                  variant="secondary"
                  className="bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                               focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
                />
                <ErrorMessages messages={fieldErrors.firstName} />
              </TextField>

              <TextField
                name="lastName"
                value={values.lastName}
                onChange={handleChange('lastName')}
                onBlur={handleBlur('lastName')}
                isInvalid={!!fieldErrors.lastName}
                isDisabled={isLoading}
                fullWidth
              >
                <Label className="text-foreground-secondary text-sm">Last name</Label>
                <Input
                  placeholder="Doe"
                  variant="secondary"
                  className="bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                               focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
                />
                <ErrorMessages messages={fieldErrors.lastName} />
              </TextField>
            </div>

            <TextField
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              isInvalid={!!fieldErrors.email}
              isDisabled={isLoading}
              fullWidth
            >
              <Label className="text-foreground-secondary text-sm">Email address</Label>
              <Input
                placeholder="you@example.com"
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
              isInvalid={!!fieldErrors.password}
              isDisabled={isLoading}
              fullWidth
            >
              <Label className="text-foreground-secondary text-sm">Password</Label>
              <Input
                placeholder="Your password"
                variant="secondary"
                className="bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                             focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
              />

              {values.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.score >= step
                          ? strength.color
                          : 'bg-white/10'
                          }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-xs ${strength.score <= 1 ? 'text-red-400' :
                      strength.score === 2 ? 'text-orange-400' :
                        strength.score === 3 ? 'text-yellow-400' :
                          'text-emerald-400'
                      }`}>
                      {strength.label}
                    </p>
                  )}
                </div>
              )}
              <ErrorMessages messages={fieldErrors.password} />
            </TextField>

            <TextField
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              isInvalid={!!fieldErrors.confirmPassword}
              isDisabled={isLoading}
              fullWidth
            >
              <Label className="text-foreground-secondary text-sm">Confirm password</Label>
              <Input
                placeholder="Re-type password"
                variant="secondary"
                className={`bg-content1 border-divider text-foreground placeholder:text-foreground-quaternary
                              focus:bg-white/[0.07] transition-colors
                              ${touched.confirmPassword && values.confirmPassword
                    ? values.confirmPassword === values.password
                      ? 'focus:border-emerald-500/60 border-emerald-500/30'
                      : 'focus:border-red-500/60'
                    : 'focus:border-violet-500/60'
                  }`}
              />
              {touched.confirmPassword && values.confirmPassword && !fieldErrors.confirmPassword && (
                <p className="text-emerald-400 text-xs mt-1">Passwords match</p>
              )}
              <ErrorMessages messages={fieldErrors.confirmPassword} />
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
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-sm text-foreground-tertiary">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </Card.Footer>
        </Form>
      </Card>
      
    </PageWrapper>
  );
}

export default SignUpPage;