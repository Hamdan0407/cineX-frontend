import { useAuth } from "@clerk/react";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { clearApiAuth, configureApiAuth } from "../api/apiClient";

interface ApiAuthSetupProps {
  children: ReactNode;
}

export function ApiAuthSetup({ children }: ApiAuthSetupProps) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    configureApiAuth({
      getToken: () => getToken(),
      onUnauthorized: () => {
        // A token can be briefly unavailable while Clerk restores a refresh session. Protected
        // actions handle 401 responses explicitly instead of forcing a sign-in modal globally.
        toast.error("Session expired", { description: "Please sign in again to continue." });
      },
      onForbidden: (message) => {
        toast.error("Access denied", { description: message });
      },
    });

    return clearApiAuth;
  }, [getToken, isLoaded]);

  return <>{children}</>;
}
