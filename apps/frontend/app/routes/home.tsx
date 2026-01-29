import PortfolioPage from "~/features/portfolio/pages/portfolio-page";
import type { Route } from "./+types/home";

export default function Home() {
    return (
        <div className="p-4">
            <h1 className="font-bold text-2xl">Stonkses</h1>
            <br />
            <PortfolioPage />
        </div>
    );
}

export function meta(_args: Route.MetaArgs) {
    return [
        { title: "Stonkses" },
        {
            name: "description",
            content:
                "A simple tool to help manage you portfolio and plan new investments",
        },
    ];
}
