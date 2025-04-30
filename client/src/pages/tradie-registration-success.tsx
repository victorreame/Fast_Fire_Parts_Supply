import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Logo from "@/components/ui/logo";
import { CheckCircle2 } from "lucide-react";

const TradieRegistrationSuccess = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-red-600 text-white p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-24 h-24 flex items-center justify-center mb-2">
              <Logo size={80} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-1">Registration Complete</CardTitle>
          <CardDescription className="text-white opacity-90">
            Thank you for joining FastFire Parts Supply
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Your account has been created</h2>
            <p className="text-center text-gray-600 mb-4">
              Your registration is complete. You can now log in to access the FastFire Parts platform.
            </p>
            <p className="text-center text-gray-600 mb-6">
              Your account has been set to <span className="font-medium">"Unassigned"</span> status. Project Managers can now send you connection requests to assign you to specific jobs and projects.
            </p>
            <div className="w-full space-y-3">
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Login to Your Account
                </Button>
              </Link>
              <p className="text-sm text-center text-gray-500">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradieRegistrationSuccess;