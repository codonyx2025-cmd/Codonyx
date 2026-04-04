import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, Shield, Users, FileText, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_type: "advisor" | "laboratory";
  email: string;
}

export function DashboardNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dynamic nav links based on user type
  // Advisors see Laboratories, Labs see Advisors
  const navLinks = profile?.user_type === "advisor" 
    ? [{ name: "Laboratories", href: "/laboratories" }]
    : profile?.user_type === "laboratory"
    ? [{ name: "Advisors", href: "/advisors" }]
    : [];

  useEffect(() => {
    const loadProfileAndCheckAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, user_type, email")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (data) {
          setProfile(data as Profile);
        }

        // Check if user is admin
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(hasAdminRole === true);
      }
    };
    loadProfileAndCheckAdmin();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-divider">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-heading text-2xl font-semibold text-foreground tracking-tight">
              Codonyx
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-primary ${
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/edit-profile" data-tour="edit-profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
            
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <Link to={`/profile/${profile?.id}`} className="flex items-center justify-start gap-2 p-2 cursor-pointer hover:bg-muted rounded-md transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${profile?.id}`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/edit-profile" className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/connections" className="cursor-pointer" data-tour="connections">
                    <Users className="mr-2 h-4 w-4" />
                    Connections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/publications" className="cursor-pointer" data-tour="publications">
                    <FileText className="mr-2 h-4 w-4" />
                    Publications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-divider animate-fade-in">
          <div className="container mx-auto px-6 py-4 space-y-4">
            {/* Profile info in mobile menu */}
            {profile && (
              <Link 
                to={`/profile/${profile.id}`} 
                className="flex items-center gap-3 pb-4 border-b border-divider"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="font-medium text-sm text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/edit-profile"
              className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Edit Profile
            </Link>
            <Link
              to="/connections"
              className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="h-4 w-4" />
              Connections
            </Link>
            <Link
              to="/publications"
              className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="h-4 w-4" />
              Publications
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
