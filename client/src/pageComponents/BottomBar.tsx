import { Home, Wallet, Plus, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils"; // Optional: for merging classes
import { Link } from "react-router";

const BottomBar = () => {
  return (
    <div className="fixed bottom-0 w-full bg-white shadow-md border-t border-gray-200 z-50">
      <div className="flex justify-between items-center px-6 py-2">
        <BottomBarItem icon={<Home size={22} />} label="Home" link="/" active />
        <BottomBarItem icon={<Wallet size={22} />} label="Explore" link="/" />
        <BottomBarItem
          icon={
            <div className="bg-black p-3 rounded-full">
              <Plus size={20} color="white" />
            </div>
          }
        />
        <BottomBarItem
          icon={<Activity size={22} />}
          label="Wishlist"
          link="/"
        />
      </div>
    </div>
  );
};

const BottomBarItem = ({
  icon,
  label,
  link,
  active = false,
}: {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  link?: string;
}) => {
  return (
    <Link
      to={link}
      className={cn(
        "flex flex-col items-center justify-center text-xs",
        active ? "text-black font-medium" : "text-gray-400",
      )}
    >
      {icon}
      {label && <span className="text-[11px] mt-1">{label}</span>}
    </Link>
  );
};

export default BottomBar;
