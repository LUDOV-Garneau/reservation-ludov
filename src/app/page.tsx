"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { useState } from "react";
// import { useTranslation } from 'react-i18next';

export default function Home() {
  // const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [AlertErrorMessage, setAlertErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();
    if (!email || !password) {
      setShowErrorAlert(true);
      setAlertErrorMessage('Tous les champs sont requis.');
      setIsLoading(false);
    } else {
      setShowErrorAlert(false);   
    }
  };

  return (
    <div className='min-h-screen'>
      <div className='container-page'>
        <div className='bg-background p-5 md:p-10 m-5 md:mx-20 rounded-2xl text-center md:py-20 py-10'>
          <h1 className='text-6xl font-semibold'>Connexion</h1>
          <form noValidate method="POST" onSubmit={handleSubmit} className="md:mx-auto md:w-[50%]">
            {showErrorAlert &&
              <Alert variant="destructive" className="text-left my-5">
                <AlertCircleIcon />
                <AlertTitle>Tous les champs sont requis.</AlertTitle>
                <AlertDescription>
                  <p>AlertErrorMessage</p>
                </AlertDescription>
              </Alert>
            }
            <div className="flex flex-col gap-3 mt-10">
              <Label htmlFor="emailInput">Courriel</Label>
              <Input 
                type="email" 
                name="emailInput"
                id="emailInput"
                autoComplete="email"
                onChange = {(e) => setEmail(e.target.value)}
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
                onChange = {(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button className="mt-10 w-full" type="submit" disabled={!email || !password}>
              {isLoading ? 
              (
                'Connexion en cours...'
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <a href="#" className="mt-10 inline-block text-sm text-primary">Première connexion ?</a>
        </div>
      </div>
    </div>
  );
}
