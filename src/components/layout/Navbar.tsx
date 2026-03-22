import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Technology", href: "/technology" },
  { name: "Contact Us", href: "/contact" },
];

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string | null;
  approval_status: "pending" | "approved" | "rejected";
}

// Module-level cache so Navbar doesn't re-fetch on every page navigation
let cachedProfile: UserProfile | null = null;
let cachedUserId: string | null = null;

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [isLoggedIn, setIsLoggedIn] = useState(!!cachedProfile);
  const [isLoading, setIsLoading] = useState(false);
  const profileFetched = useRef(!!cachedProfile);

  const fetchProfile = useCallback(async (userId: string) => {
    // Skip if already fetched for this user
    if (cachedUserId === userId && cachedProfile) {
      setProfile(cachedProfile);
      setIsLoggedIn(true);
      profileFetched.current = true;
      return;
    }
    if (profileFetched.current) return;
    profileFetched.current = true;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, approval_status")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.approval_status === "approved") {
        const { full_name, email, avatar_url } = data;
        const p = { full_name, email, avatar_url, approval_status: data.approval_status };
        cachedProfile = p;
        cachedUserId = userId;
        setProfile(p);
        setIsLoggedIn(true);
      } else {
        profileFetched.current = false;
        cachedProfile = null;
        cachedUserId = null;
        setProfile(null);
        setIsLoggedIn(false);
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      profileFetched.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mounted) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        await fetchProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        profileFetched.current = false;
        cachedProfile = null;
        cachedUserId = null;
        setProfile(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleNavClick = useCallback((href: string) => {
    if (location.pathname === href) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={() => handleNavClick("/")} className="flex items-center gap-3">
            <img src={codonyxLogo} alt="Codonyx" className="h-10 w-10 object-contain" fetchPriority="high" decoding="sync" />
            <span className="font-heading text-2xl font-semibold text-white tracking-tight">
              Codonyx
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-emerald-glow ${
                  location.pathname === link.href
                    ? "text-emerald-glow"
                    : "text-white/70"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Area */}
          <div className="hidden lg:flex items-center">
            {isLoggedIn && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted rounded-md transition-colors">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="primary" size="lg">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy border-t border-white/10 animate-fade-in">
          <div className="container mx-auto px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block text-sm font-medium tracking-wide uppercase text-white/70 hover:text-emerald-glow transition-colors py-2"
                onClick={() => handleNavClick(link.href)}
              >
                {link.name}
              </Link>
            ))}
            {isLoggedIn && profile ? (
              <>
                <div className="flex items-center gap-3 py-3 border-t border-white/10 mt-2 pt-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
                    <p className="text-xs text-white/50 truncate">{profile.email}</p>
                  </div>
                </div>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full mt-3">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="w-full text-foreground bg-white border-white/20 hover:bg-white/90" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full mt-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
