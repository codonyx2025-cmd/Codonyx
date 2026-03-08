import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) {
      // Same page clicked again — smooth scroll
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // New page — instant scroll
      window.scrollTo(0, 0);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
}
