export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-white py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">© {currentYear} TOP BET MONEY MANAGEMENT - Uno strumento per il money management nelle scommesse sportive</p>
      </div>
    </footer>
  );
}
