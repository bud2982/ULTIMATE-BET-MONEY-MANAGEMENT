export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message) || 
         /^403: .*Premium subscription required/.test(error.message);
}

export function handleAuthError(error: Error, toast: any) {
  if (isUnauthorizedError(error)) {
    toast({
      title: "Accesso Richiesto",
      description: "Effettua il login per accedere a questa funzionalità.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 1000);
    return true;
  }
  return false;
}