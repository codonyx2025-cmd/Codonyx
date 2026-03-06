import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Password reset is now OTP-based via the auth page dialog
    navigate("/auth", { replace: true });
  }, [navigate]);

  return null;
}
