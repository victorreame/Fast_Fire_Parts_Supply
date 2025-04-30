import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
          <CardTitle className="text-2xl font-bold mb-1">FastFire Parts Supply</CardTitle>
          <CardDescription className="text-white opacity-90">Registration Successful</CardDescription>
        </CardHeader>

        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Thank You for Registering!</h2>
          
          <div className="space-y-4 text-gray-600">
            <p>
              Your registration has been submitted successfully. There are two more steps before you can start using the platform:
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md text-left">
              <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <span className="font-medium">Verify your email address:</span> Please check your inbox for a verification email and click the link to verify your account.
                </li>
                <li>
                  <span className="font-medium">Project Manager approval:</span> Once your email is verified, your account will be reviewed by your Project Manager.
                </li>
              </ol>
            </div>
            
            <p>
              You'll receive a notification when your account has been approved, and then you can log in and start using the platform.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-gray-50 flex justify-center">
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700">
              Go to Login Page
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TradieRegistrationSuccess;