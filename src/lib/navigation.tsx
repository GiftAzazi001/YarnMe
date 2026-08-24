import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type RouterContextType = {
  pathname: string;
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

const NavigationContext = createContext<RouterContextType>({
  pathname: "/",
  push: () => {},
  replace: () => {},
  back: () => {},
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const push = useCallback((href: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", href);
      setPathname(window.location.pathname || href);
      window.scrollTo(0, 0);
    }
  }, []);

  const replace = useCallback((href: string) => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", href);
      setPathname(window.location.pathname || href);
      window.scrollTo(0, 0);
    }
  }, []);

  const back = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, []);

  return (
    <NavigationContext.Provider value={{ pathname, push, replace, back }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(NavigationContext);
  return {
    push: context.push,
    replace: context.replace,
    back: context.back,
  };
}

export function usePathname() {
  const context = useContext(NavigationContext);
  return context.pathname;
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  replace?: boolean;
};

export function Link({ href, children, onClick, replace = false, ...props }: LinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && props.target !== "_blank") {
      e.preventDefault();
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export default Link;
