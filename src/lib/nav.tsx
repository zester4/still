"use client";

import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: string;
  to?: string;
  children?: ReactNode;
};

export function Link({ to, href, children, ...props }: LinkProps) {
  return (
    <NextLink href={(href ?? to ?? "/") as string} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (opts: { to: string }) => {
    router.push(opts.to);
  };
}

export function useRouterState({
  select,
}: {
  select: (s: { location: { pathname: string } }) => string;
}) {
  const pathname = usePathname();
  return select({ location: { pathname } });
}
