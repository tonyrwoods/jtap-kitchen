import { useNavigate, useLocation } from "react-router-dom";

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isChildRoute = location.pathname !== "/";

  const handleBack = () => {
    if (isChildRoute) {
      navigate(-1);
    }
  };

  return { handleBack, isChildRoute };
}