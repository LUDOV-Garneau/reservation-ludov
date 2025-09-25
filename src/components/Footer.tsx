import Image from "next/image";

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
        <div className="relative z-10 flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">
            <Image
              src="/images/LUDOV-logo-texte.png"
              alt="LUDOV"
              width={1010}
              height={247}
              className="w-[128px] h-auto"
            />
          </h1>
          <div className="flex gap-6">
            <a
              href="https://www.ludov.ca/fr/contact/"
              className="text-black hover:text-[#aaaaaa] transition-all duration-300"
            >
              Contact
            </a>
            <a
              href="/politiques"
              className="text-black hover:text-[#aaaaaa] transition-all duration-300"
            >
              Politique
            </a>
          </div>
        </div>

        <hr className="mt-4 mb-8" />

        <div className="relative z-10 md:text-center mx-auto">
          <a
            href="https://www.dukelon.com/"
            target="_blank"
            className="opacity-70 hover:opacity-100 transition-all duration-300"
          >
            Développé dans le cadre du cours projet intégrateur par des
            étudiants du Cégep Garneau
          </a>
          <p className="mt-6">
            &copy; Copyright 2025 LUDOV (Laboratoire universitaire de
            documentation et d&apos;observation vidéoludiques) - Tous droits
            réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
