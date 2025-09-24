import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function Home() {
  return (
    <div className='min-h-screen'>
      <div className='container-page'>
        <div className='bg-background p-5 md:p-10 m-5 md:mx-20 rounded-2xl text-center md:py-20 py-10'>
          <h1 className='text-6xl font-semibold'>Connexion</h1>
          <form noValidate method="POST" className="md:mx-auto md:w-[50%]">
            <div className="flex flex-col gap-3 mt-10">
              <Label htmlFor="emailInput">Courriel</Label>
              <Input 
                type="email" 
                name="emailInput"
                id="emailInput"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <Label htmlFor="passwordInput">Mot de passe</Label>
              <Input 
                type="password" 
                name="passwordInput"
                id="passwordInput"
                autoComplete="current-password"
                required 
              />
            </div>
            <Button className="mt-10 w-full" type="submit">Se connecter</Button>
          </form>

          <a href="#" className="mt-10 inline-block text-sm text-primary">Première connexion ?</a>
        </div>
      </div>
    </div>
  );
}
