"use client";

import { Button } from "@/components/custom/button";
import { API_URL } from "@/lib/constants";

const LoginButton = () => {
  return (
    <Button onClick={async () => {
      const response = await fetch(`${API_URL}/quickbook/redirect-url`, {
        cache: "no-store",
      });
      const res = await response.json();

      console.info("[QuickBooksOAuth] redirect", {
        redirectUri: res.redirectUri,
        environment: res.environment,
        status: response.status,
        hasAuthUri: Boolean(res.authUri),
      });

      if (!res.success || !res.authUri) {
        alert(res.message || "Unable to start QuickBooks connection.");
        return;
      }

      window.location.href = res.authUri;
    }}>
      Login to Quickbook
    </Button>
  );
};

export default LoginButton;
