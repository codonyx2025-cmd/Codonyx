const FALLBACK_PROJECT_REF = "mbalhtajoruhzhraxnxc";

export const REMEMBER_ME_KEY = "codonyx-remember-me";
export const SIGNING_OUT_KEY = "codonyx-signing-out";

function getProjectRef() {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return FALLBACK_PROJECT_REF;
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] || FALLBACK_PROJECT_REF;
  } catch {
    return FALLBACK_PROJECT_REF;
  }
}

export const SUPABASE_TOKEN_KEY = `sb-${getProjectRef()}-auth-token`;

declare global {
  interface Window {
    __codonyxAuthStorageGuardInstalled?: boolean;
    __codonyxAuthPagehideGuardInstalled?: boolean;
  }
}

export function isSignOutInProgress() {
  try {
    return sessionStorage.getItem(SIGNING_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSignOutInProgress() {
  try {
    sessionStorage.setItem(SIGNING_OUT_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

export function clearSignOutInProgress() {
  try {
    sessionStorage.removeItem(SIGNING_OUT_KEY);
  } catch {
    // ignore storage errors
  }
}

function isAuthStorageKey(key: string) {
  return key === SUPABASE_TOKEN_KEY || key.startsWith("sb-");
}

export function clearStoredAuthState(options: { includeRemember?: boolean } = {}) {
  const { includeRemember = true } = options;

  const wipe = (store: Storage) => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (!key) continue;
        if (isAuthStorageKey(key) || (includeRemember && key === REMEMBER_ME_KEY)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => store.removeItem(key));
    } catch {
      // ignore storage errors
    }
  };

  wipe(localStorage);
  wipe(sessionStorage);
}

export function installAuthStorageGuard() {
  if (window.__codonyxAuthStorageGuardInstalled) return;
  window.__codonyxAuthStorageGuardInstalled = true;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function setItemGuard(this: Storage, key: string, value: string) {
    const storageKey = String(key);

    if (isSignOutInProgress() && isAuthStorageKey(storageKey)) {
      return;
    }

    originalSetItem.call(this, storageKey, value);

    if (
      this === localStorage &&
      isAuthStorageKey(storageKey) &&
      localStorage.getItem(REMEMBER_ME_KEY) === "false" &&
      !isSignOutInProgress()
    ) {
      try {
        originalSetItem.call(sessionStorage, storageKey, value);
      } catch {
        // ignore storage errors
      }
    }
  };

  Storage.prototype.removeItem = function removeItemGuard(this: Storage, key: string) {
    const storageKey = String(key);
    originalRemoveItem.call(this, storageKey);

    if (this === localStorage && isAuthStorageKey(storageKey)) {
      try {
        originalRemoveItem.call(sessionStorage, storageKey);
      } catch {
        // ignore storage errors
      }
    }
  };

  if (!window.__codonyxAuthPagehideGuardInstalled) {
    window.__codonyxAuthPagehideGuardInstalled = true;
    window.addEventListener("pagehide", () => {
      if (isSignOutInProgress()) {
        clearStoredAuthState();
        return;
      }

      if (localStorage.getItem(REMEMBER_ME_KEY) === "false") {
        try {
          localStorage.removeItem(SUPABASE_TOKEN_KEY);
        } catch {
          // ignore storage errors
        }
      }
    });
  }
}

export function restoreSessionStorageToken() {
  installAuthStorageGuard();

  if (isSignOutInProgress()) {
    clearStoredAuthState();
    return;
  }

  try {
    const remember = localStorage.getItem(REMEMBER_ME_KEY);
    if (remember !== "false") return;

    const sessionToken = sessionStorage.getItem(SUPABASE_TOKEN_KEY);
    if (sessionToken) {
      localStorage.setItem(SUPABASE_TOKEN_KEY, sessionToken);
    }
  } catch {
    // ignore storage errors
  }
}
