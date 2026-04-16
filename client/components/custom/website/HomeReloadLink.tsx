"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type HomeReloadLinkProps = ComponentProps<typeof Link>;

export default function HomeReloadLink({
  href,
  onClick,
  ...props
}: HomeReloadLinkProps) {
  const pathname = usePathname();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) return;

    const isHomeHref =
      typeof href === "string"
        ? href === "/"
        : href?.pathname === "/";

    if (pathname === "/" && isHomeHref) {
      event.preventDefault();
      window.location.reload();
    }
  };

  return <Link {...props} href={href} onClick={handleClick} />;
}
