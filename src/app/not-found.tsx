import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex items-center gap-3">
        <Image
          src="/images/LUDOV-logo.png"
          alt="Ludov logo"
          width={1169}
          height={1139}
          className="w-12 h-full"
        />
        <span className="text-4xl text-gray-400 font-bold tracking-wide ml-2">
          LUDOV
        </span>
      </div>
      <div className="bg-white rounded-2xl shadow-md px-10 py-14 max-w-xl w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          404 - Page introuvable
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Désolé, la page que vous recherchez n&apos;existe pas ou vous
          n&apos;avez pas accès.
        </p>
        <Link
          href="/"
          className="px-5 py-2 rounded-md bg-[#02dcde] text-white font-semibold text-lg shadow hover:opacity-70 transition"
        >
          Retourner à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
