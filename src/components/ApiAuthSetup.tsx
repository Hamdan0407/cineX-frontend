import { useAuth, useClerk } from "@clerk/react";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { configureApiAuth } from "../api/apiClient";

interface ApiAuthSetupProps {
  children: ReactNode;
}

export function ApiAuthSetup({ children }: ApiAuthSetupProps) {
  const { getToken, isLoaded } = useAuth();
  const { openSignIn } = useClerk();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    configureApiAuth({
      getToken: () => getToken(),
      onUnauthorized: () => {
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
        });
        openSignIn();
      },
      onForbidden: (message) => {
        toast.error("Access denied", { description: message });
      },
    });
  }, [getToken, isLoaded, openSignIn]);

  return <>{children}</>;
}
