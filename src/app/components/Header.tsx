import Image from "next/image";

export default async function Header() {
  const user = await getUser();

  return (
    <div className="background-white">
      <header className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl flex justify-between items-center">
        <Image
          src="/images/LUDOV-logo-texte.png"
          alt="LUDOV"
          width={1010}
          height={247}
          className="w-[128px] h-auto"
        />
        <div>
          {IsUserConnected ? (
            <p>text</p>
          ) : (
            <a
              href="#"
              className="border-2 border-black rounded-4xl px-4 py-2 hover:bg-[#02dcde] transition-all duration-300"
            >
              Connexion
            </a>
          )}
        </div>
      </header>
    </div>
  );
}
