import { Suspense } from "react";
import SignInClient from "./SignInClient";

const SignInPage = () => {
  return (
    <Suspense fallback={null}>
      <SignInClient />
    </Suspense>
  );
}

export default SignInPage;