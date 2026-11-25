"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  [
    ["/dashboard", "Dashboard"],
    ["/contributions", "Contributions"],
    ["/dues", "Dues & commitments"],
    ["/expenses", "Expenses"],
    ["/reports", "Reports"],
  ],
  [
    ["/members", "Members"],
    ["/categories", "Payment categories"],
    ["/audit", "Audit log"],
    ["/settings", "Settings"],
    ["/account", "My account"],
  ],
];

export function WorkspaceNav() {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const menu = nav.current;
    const item = menu?.querySelector("a[aria-current]");
    if (!menu || !item || menu.scrollWidth <= menu.clientWidth) return;
    const bounds = menu.getBoundingClientRect();
    const active = item.getBoundingClientRect();
    if (active.left < bounds.left || active.right > bounds.right) {
      menu.scrollLeft += active.left - bounds.left - 8;
    }
  }, [path]);

  return (
    <nav ref={nav} aria-label="Workspace" className="workspace-nav">
      {sections.map((links) => (
        <div key={links[0][0]}>
          {links.map(([href, label]) => {
            const current = path === href ? "page" :
              path.startsWith(href + "/") ||
              (href === "/contributions" && path.startsWith("/receipts/")) ? "location" : undefined;
            return <Link key={href} href={href} aria-current={current}>{label}</Link>;
          })}
        </div>
      ))}
    </nav>
  );
}
