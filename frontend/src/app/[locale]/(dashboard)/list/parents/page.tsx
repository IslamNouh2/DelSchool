import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center bg-rose-100 dark:bg-rose-900/20 rounded-full p-4">
                        <Rocket className="h-10 w-10 text-rose-600 dark:text-rose-400" />
                    </div>

                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white">404</h1>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Page Not Found / Coming Soon
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {`Oops! This page either doesn't exist or isn't ready yet. We're working hard to bring you amazing content.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="default" size="lg">
                        <Link href="/">
                            Return Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/contact">
                            Contact Us
                        </Link>
                    </Button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Stay tuned - something awesome is coming soon!
                </p>
            </div>
        </div>
    );
}