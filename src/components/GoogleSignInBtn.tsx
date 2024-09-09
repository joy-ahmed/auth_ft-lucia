"use client";

import { getGoogleOAuthConsentUrl } from "@/app/authenticate/auth.action";
import { Button } from "./ui/button";

export const GoogleSignInBtn = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Button
      variant="outline"
      className="w-full"
      type="button"
      onClick={async () => {
        const res = await getGoogleOAuthConsentUrl();
        if (res.url) {
          window.location.href = res.url;
        } else {
          console.log(res.error);
        }
      }}
    >
      {children}
    </Button>
  );
};
