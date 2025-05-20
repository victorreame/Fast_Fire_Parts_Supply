import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MobileNavProps {
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onLogout }) => {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const closeNav = () => setOpen(false);

  const navItems = [
    { href: "/supplier/dashboard", label: "Dashboard" },
    { href: "/supplier/orders", label: "Orders" },
    { href: "/supplier/jobs", label: "Jobs" },
    { href: "/supplier/customers", label: "Customers" },
    { href: "/supplier/parts", label: "Parts" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] sm:w-[350px] pt-12">
        <div className="flex flex-col space-y-4 mt-4">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              onClick={closeNav}
              className={`px-4 py-3 rounded-md text-base font-medium transition-colors ${
                location === item.href
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          <div className="mt-8 pt-4 border-t border-neutral-200">
            <Button 
              variant="destructive" 
              className="w-full mt-2" 
              onClick={() => {
                closeNav();
                onLogout();
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;