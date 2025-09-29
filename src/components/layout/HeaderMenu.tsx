import LogoutButton from "@/components/auth/LogoutButton";
import LocaleSwitcher from "./LocaleSwitcher";

export default function HeaderMenu({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-10">
      <LocaleSwitcher />
      <LogoutButton name={username} />
    </div>
  );
}
