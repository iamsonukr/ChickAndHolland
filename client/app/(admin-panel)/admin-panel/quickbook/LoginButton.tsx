"use client";

import { Button } from "@/components/custom/button";
import { getQuickbookRedirectUrl } from "@/lib/data";

const LoginButton = () => {
  return (
    <Button onClick={async () => {
      const res = await getQuickbookRedirectUrl();
      window.location.href = res.authUri;
    }}>
      Login to Quickbook
    </Button>
  );
};

export default LoginButton;