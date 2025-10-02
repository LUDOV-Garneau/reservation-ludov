import Image from "next/image";
import FooterInfos from "./FooterInfos";

export default function Footer() {
  return (
    <div className="bg-[white] overflow-x-clip overflow-y-hidden">
      <footer className="relative md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl">
        <Image
          src="/images/LUDOV-logo.png"
          alt=""
          aria-hidden="true"
          width={1169}
          height={1139}
          className="inline pointer-events-none select-none absolute right-[-30px] bottom-[-120px] w-[400px] h-auto opacity-25 z-0"
        />
        <FooterInfos />
      </footer>
    </div>
  );
}
