# Layout Grafico Money Management Pro - Guida per Cursor

## 🎨 Schema Colori Attuale

### Colori Principali (definiti in `client/src/index.css`)
```css
:root {
  --primary: 215 30% 18%;           /* #2C3E50 - Blu scuro principale */
  --secondary: 142 69% 49%;         /* #4CAF50 - Verde successo */
  --accent: 51 100% 50%;            /* #FFD700 - Giallo oro */
  --destructive: 0 84.2% 60.2%;     /* #e63946 - Rosso errore */
  --background: 0 0% 100%;          /* #FFFFFF - Sfondo bianco */
  --foreground: 20 14.3% 4.1%;      /* #0A0A0A - Testo nero */
  --muted: 60 4.8% 95.9%;           /* #F5F5F5 - Grigio chiaro */
  --border: 20 5.9% 90%;            /* #E5E5E5 - Bordi */
  --card: 0 0% 100%;                /* #FFFFFF - Sfondo card */
}

/* Tema Scuro */
.dark {
  --background: 240 10% 3.9%;       /* #0A0A0A - Sfondo nero */
  --foreground: 0 0% 98%;           /* #FAFAFA - Testo bianco */
  --card: 240 10% 3.9%;             /* #0A0A0A - Sfondo card scuro */
  --border: 240 3.7% 15.9%;         /* #262626 - Bordi scuri */
}
```

## 🏗️ Struttura Layout Principale

### App.tsx - Router e Navigazione
```typescript
// File: client/src/App.tsx
// Gestisce routing tra pagine strategie

Route path="/" → home.tsx (Homepage con pulsanti)
Route path="/strategia/kelly" → strategy-kelly.tsx
Route path="/strategia/dalembert" → strategy-dalembert.tsx
Route path="/strategia/masaniello" → strategy-masaniello.tsx
Route path="/strategia/percentage" → strategy-percentage.tsx
Route path="/strategia/beat-delay" → strategy-beat-delay.tsx
Route path="/strategia/profitfall" → strategy-profitfall.tsx
```

### Homepage Layout (home.tsx)
```typescript
// Layout principale homepage:
<div className="min-h-screen bg-gray-100">
  <Header />
  <main className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Pulsanti strategie */}
      <StrategyCard title="Kelly Criterion" route="/strategia/kelly" />
      <StrategyCard title="D'Alembert" route="/strategia/dalembert" />
      <StrategyCard title="Masaniello" route="/strategia/masaniello" />
      <StrategyCard title="Percentage" route="/strategia/percentage" />
      <StrategyCard title="Beat Delay" route="/strategia/beat-delay" />
      <StrategyCard title="Profit Fall" route="/strategia/profitfall" />
    </div>
  </main>
  <Footer />
</div>
```

## 📄 Layout Pagine Strategie

### Struttura Comune Pagine Strategie
```typescript
// Ogni pagina strategia (es. strategy-kelly.tsx) ha:
<div className="min-h-screen bg-gray-100">
  <SimpleHeader title="Kelly Criterion" />
  
  <div className="container mx-auto px-4 py-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Colonna Sinistra - Controlli */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Parametri Strategia</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Form parametri */}
          </CardContent>
        </Card>
      </div>
      
      {/* Colonna Destra - Risultati */}
      <div className="lg:col-span-2">
        <CurrentSession />
        <PerformanceDashboard />
        <SessionsHistory />
      </div>
    </div>
  </div>
</div>
```

## 🧩 Componenti Layout Principali

### Header (header.tsx)
```typescript
// Layout header completo con navigazione
<header className="bg-primary text-primary-foreground shadow-lg">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Money Management Pro</h1>
      </div>
      <nav className="flex items-center space-x-6">
        <Button variant="ghost">Account</Button>
        <Button variant="ghost">Pricing</Button>
        <ThemeToggle />
      </nav>
    </div>
  </div>
</header>
```

### Simple Header (simple-header.tsx)
```typescript
// Header semplificato per pagine strategie
<header className="bg-white shadow-sm border-b">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <TrialStatus />
        <ThemeToggle />
      </div>
    </div>
  </div>
</header>
```

### Current Session (current-session.tsx)
```typescript
// Pannello sessione corrente
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span>Sessione Corrente</span>
      <Badge variant="secondary">ATTIVA</Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">€{bankroll}</div>
        <div className="text-sm text-muted-foreground">Bankroll</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary">€{profit}</div>
        <div className="text-sm text-muted-foreground">Profitto</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{totalBets}</div>
        <div className="text-sm text-muted-foreground">Scommesse</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{winRate}%</div>
        <div className="text-sm text-muted-foreground">Win Rate</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Performance Dashboard (performance-dashboard.tsx)
```typescript
// Dashboard con grafici
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Performance Analytics</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Trend Bankroll</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="bankroll" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Distribuzione Risultati</h3>
        {/* Grafico a torta o barre */}
      </div>
    </div>
  </CardContent>
</Card>
```

## 🎯 Componenti UI Shadcn/Tailwind

### Button Styles
```typescript
// Varianti pulsanti (client/src/components/ui/button.tsx)
variants: {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  }
}
```

### Card Styles
```typescript
// Layout cards (client/src/components/ui/card.tsx)
<Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
    <CardDescription className="text-sm text-muted-foreground">
  </CardHeader>
  <CardContent className="p-6 pt-0">
  <CardFooter className="flex items-center p-6 pt-0">
</Card>
```

### Form Styles
```typescript
// Layout form (client/src/components/ui/form.tsx)
<Form>
  <FormField
    control={form.control}
    name="bankroll"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Bankroll Iniziale</FormLabel>
        <FormControl>
          <Input placeholder="1000" {...field} />
        </FormControl>
        <FormDescription>
          Importo del bankroll in euro
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

## 📱 Layout Responsive

### Breakpoints Tailwind
```css
/* Mobile First */
sm: 640px     /* Small devices */
md: 768px     /* Medium devices */
lg: 1024px    /* Large devices */
xl: 1280px    /* Extra large devices */
2xl: 1536px   /* 2X large devices */
```

### Grid Responsive
```typescript
// Esempi grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="flex flex-col md:flex-row gap-4">
```

## 🔧 Personalizzazione Cursor

### Per modificare colori:
1. **Cambia colori principali**: Modifica `client/src/index.css` variabili `:root`
2. **Aggiorna tema**: Modifica anche `.dark` per tema scuro
3. **Ricompila**: Salva file per vedere cambiamenti

### Per modificare layout:
1. **Homepage**: Modifica `client/src/pages/home.tsx`
2. **Pagine strategie**: Modifica `client/src/pages/strategy-*.tsx`
3. **Componenti**: Modifica `client/src/components/*.tsx`

### Per aggiungere nuovi componenti:
1. **Crea componente**: In `client/src/components/`
2. **Importa**: In pagina che lo usa
3. **Stila**: Con classi Tailwind

## 🎨 Suggerimenti Design

### Colori da considerare:
- **Finanziario**: Blu scuro, verde, oro
- **Sportivo**: Arancione, rosso, blu
- **Moderno**: Nero, bianco, grigio, accent colorato

### Layout miglioramenti:
- **Più spazio**: Aumenta padding/margin
- **Cards elevate**: Aggiungi shadow più pronunciate
- **Animazioni**: Aggiungi hover effects
- **Icone**: Usa più icone Lucide React

---

**File da modificare in Cursor:**
- `client/src/index.css` (colori)
- `client/src/pages/home.tsx` (homepage)
- `client/src/pages/strategy-*.tsx` (pagine strategie)
- `client/src/components/*.tsx` (componenti)
- `tailwind.config.ts` (configurazione Tailwind)