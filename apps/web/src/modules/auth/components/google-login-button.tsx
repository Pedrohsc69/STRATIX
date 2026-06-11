import { useEffect, useRef, useState } from "react";

type GoogleLoginButtonProps = {
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError: (message: string) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services unavailable"));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function GoogleLoginButton({
  disabled = false,
  onCredential,
  onError,
}: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);
  const [unavailable, setUnavailable] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    credentialHandlerRef.current = onCredential;
    errorHandlerRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }

    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response.credential) {
              errorHandlerRef.current("Não foi possível autenticar com Google.");
              return;
            }

            void credentialHandlerRef.current(response.credential);
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: containerRef.current.offsetWidth || 360,
          logo_alignment: "left",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-center">
        <p className="text-sm text-muted-foreground">
          Login com Google indisponível nesta configuração.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border border-border bg-background px-3 py-3 ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div ref={containerRef} className="flex w-full justify-center" />
      </div>
      {unavailable ? (
        <p className="text-center text-sm text-destructive">
          Não foi possível carregar o login com Google no momento.
        </p>
      ) : null}
    </div>
  );
}
