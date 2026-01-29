import { Navigate } from "react-router";
import { DEFAULT_REDIRECTS } from "~/global/constants/routes";

export default function App() {
    return <Navigate to={DEFAULT_REDIRECTS.UNAUTHENTICATED} />;
}
