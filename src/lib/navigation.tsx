"use client";

import NextLink from "next/link";
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
} from "next/navigation";
import React, { type AnchorHTMLAttributes, type ReactNode } from "react";

export function useRouter() {
  const router = useNextRouter();
  return {
    push: (href: string) => router.push(href),
    replace: (href: string) => router.replace(href),
    back: () => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
    prefetch: (href: string) => router.prefetch(href),
  };
}

export function usePathname(): string {
  const pathname = useNextPathname();
  return pathname || "/";
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  replace?: boolean;
};

export function Link({
  href,
  children,
  replace = false,
  className,
  ...props
}: LinkProps) {
  return (
    <NextLink href={href} replace={replace} className={className} {...props}>
      {children}
    </NextLink>
  );
}

export default Link;
