"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
        },
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

type GoogleRecaptchaProps = {
  value: string;
  onChange: (token: string) => void;
  theme?: "light" | "dark";
};

const scriptId = "google-recaptcha-api";

const GoogleRecaptcha = ({
  value,
  onChange,
  theme = "light",
}: GoogleRecaptchaProps) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableId = useMemo(
    () => `recaptcha-${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  useEffect(() => {
    if (window.grecaptcha?.render) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!siteKey || !scriptLoaded || widgetIdRef.current !== null) {
      return;
    }

    let attempts = 0;

    const renderWidget = () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      if (!window.grecaptcha?.render) {
        if (attempts < 20) {
          attempts += 1;
          pollTimerRef.current = setTimeout(renderWidget, 250);
          return;
        }

        setRenderError(
          "Google reCAPTCHA script did not finish loading. Please refresh and try again.",
        );
        return;
      }

      try {
        widgetIdRef.current = window.grecaptcha.render(container, {
          sitekey: siteKey,
          theme,
          callback: (token) => {
            setRenderError(null);
            onChange(token);
          },
          "expired-callback": () => onChange(""),
          "error-callback": () => {
            setRenderError(
              "Google reCAPTCHA could not load properly. Please refresh and try again.",
            );
            onChange("");
          },
        });
      } catch (error) {
        console.error("Failed to render Google reCAPTCHA:", error);
        setRenderError(
          "Google reCAPTCHA could not load properly. Please refresh and try again.",
        );
      }
    };

    renderWidget();
  }, [onChange, scriptLoaded, siteKey, theme]);

  useEffect(() => {
    if (!value && widgetIdRef.current !== null && window.grecaptcha?.reset) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (error) {
        console.error("Failed to reset Google reCAPTCHA:", error);
      }
    }
  }, [value]);

  if (!siteKey) {
    return (
      <div className="rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive">
        Google reCAPTCHA site key is missing. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
        to the client environment.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        id={scriptId}
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() =>
          setRenderError(
            "Google reCAPTCHA script failed to load. Check your internet connection and try again.",
          )
        }
      />
      <div id={stableId} ref={containerRef} className="min-h-[78px]" />
      {renderError ? (
        <p className="text-sm text-destructive">{renderError}</p>
      ) : null}
    </div>
  );
};

export default GoogleRecaptcha;
