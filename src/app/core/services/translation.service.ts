import { Injectable, computed, signal } from '@angular/core';

export type Language = 'es' | 'en';

const TRANSLATIONS = {
  es: {
    // Navigation & Shell
    howItWorks: 'Cómo funciona',
    myOverview: 'Mi resumen',
    mySpace: 'Mi espacio',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    currency: 'Moneda',
    theme: 'Tema',
    themeLight: 'Tema claro',
    themeDark: 'Tema oscuro',
    settings: 'Ajustes',
    settingsAndHouses: 'Ajustes y casas',
    matches: 'Partidos del día',
    oddsAndStats: 'Cuotas y Stats',
    registerTicket: 'Registrar ticket',
    myBank: 'Mi bank',
    myBets: 'Mis apuestas',
    profitability: 'Rentabilidad',
    challenges: 'Retos',
    community: 'Comunidad Tipsters',
    myProfile: 'Mi Perfil',
    tutorial: 'Tutorial de uso',
    logout: 'Cerrar sesión',
    responsibleBadge: '18+ · Registro responsable',

    // Landing Page
    proBadge: 'PRO',
    proTag: 'Control de Bankroll auditado · Seguimiento en vivo con ESPN y MLB',
    heroTag: 'WNBA, NBA, NFL Y FÚTBOL · CONTROL AUDITADO POR PARTIDO',
    heroTitle1: 'Control de apuestas que',
    heroTitle2: 'rinde cuentas.',
    heroDesc: 'Registra cada jugada con partidos oficiales de ESPN y MLB, gestiona tus saldos por casa y audita tu rentabilidad real antes y después de cada partido. Nada se borra. Cero sesgos.',
    ctaStart: 'Empezar mi registro',
    ctaOverview: 'Ver mi resumen',
    howModelWorks: 'Cómo funciona el modelo',
    auditedCalib: 'CALIBRACIÓN AUDITADA',
    viewCalibration: 'Ver el control de aciertos',
    liveBankControl: 'Control de Bankroll en Vivo',
    multiBookieTag: 'Multi-casa · MXN y USD',
    consolidatedBank: 'Bank total consolidado',
    consolidatedSub: 'Disponible + apuestas en juego',
    netYield: 'Rendimiento / Yield',
    netYieldSub: 'Retorno sobre inversión real',
    available: 'Disponible',
    inPlay: 'En juego',
    winRate: 'Aciertos',
    methodology: 'METODOLOGÍA AUDITADA',
    methodologyTitle1: 'Todo lo importante.',
    methodologyTitle2: 'Sin perderte entre números.',
    methodologyDesc: 'Construido para apostadores serios que buscan rentabilidad a largo plazo basada en datos y disciplina.',
    feature1Title: 'Controla cada casa',
    feature1Desc: 'Añade tus casas de apuestas, registra depósitos, retiros y visualiza tu exposición por divisa en tiempo real.',
    feature2Title: 'Registra con datos oficiales',
    feature2Desc: 'Consulta partidos en vivo de ESPN, MLB y NFL. Vincula cuotas, hándicaps o selecciones de mismo partido sin errores.',
    feature3Title: 'Audita tus números reales',
    feature3Desc: 'Identifica qué ligas y mercados te dan ganancias reales, sigue tus retos y protege tu bank con alertas de disciplina.',
    feature4Title: 'Récord público inalterable',
    feature4Desc: 'Genera un enlace público auditado para demostrar tu rentabilidad ante seguidores o inversores sin trampas.',
    feature5Title: 'Props y probabilidades (+EV)',
    feature5Desc: 'Accede a cuotas oficiales de Bet365 y DraftKings, probabilidades implícitas y rendimiento de jugadores en vivo.',
    feature6Title: 'Alertas de disciplina y stop-loss',
    feature6Desc: 'Protege tu capital con límites estrictos por apuesta y advertencias cuando excedes el porcentaje de bank recomendado.',
    ageWarningTitle: 'El registro empieza por un límite.',
    ageWarningDesc: 'Las apuestas son exclusivamente para mayores de 18 años. Puedes perder el dinero apostado. BetRegister es una herramienta de gestión y análisis personal: no recibe apuestas ni garantiza ganancias. Establece límites claros y nunca arriesgues fondos destinados a necesidades esenciales.',
    ctaBottomTitle1: 'Tu próxima decisión empieza',
    ctaBottomTitle2: 'por entender tu historial.',
    ctaBottomDesc: 'Comienza a registrar hoy mismo. Cero costos ocultos.',

    // Auth Page
    authCreateTitle: 'Crea tu cuenta',
    authCreateSubtitle: 'Introduce tu correo y crea una contraseña para empezar.',
    authLoginTitle: 'Bienvenido de nuevo',
    authLoginSubtitle: 'Ingresa a tu espacio auditado de apuestas.',
    authEmail: 'Correo electrónico',
    authPassword: 'Contraseña',
    authConfirmPassword: 'Confirma tu contraseña',
    authMinChars: 'Mínimo 10 caracteres',
    authAdultConfirm: 'Confirmo que tengo 18 años o más.',
    authTermsConfirm: 'Acepto los Términos de uso y la Privacidad.',
    authTerms: 'Términos de uso',
    authPrivacy: 'Privacidad',
    authSubmitCreate: 'Crear mi cuenta',
    authSubmitLogin: 'Iniciar sesión',
    authHasAccount: '¿Ya tienes una cuenta registrada?',
    authNoAccount: '¿Aún no tienes cuenta?',
    authGoLogin: 'Inicia sesión aquí',
    authGoRegister: 'Crear cuenta nueva',
  },
  en: {
    // Navigation & Shell
    howItWorks: 'How it works',
    myOverview: 'My Overview',
    mySpace: 'Workspace',
    login: 'Sign in',
    register: 'Create account',
    currency: 'Currency',
    theme: 'Theme',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    settings: 'Settings',
    settingsAndHouses: 'Settings & Bookies',
    matches: 'Daily Matches',
    oddsAndStats: 'Odds & Stats',
    registerTicket: 'Log Ticket',
    myBank: 'My Bank',
    myBets: 'My Bets',
    profitability: 'Profitability',
    challenges: 'Challenges',
    community: 'Tipsters Community',
    myProfile: 'My Profile',
    tutorial: 'Usage tutorial',
    logout: 'Sign out',
    responsibleBadge: '18+ · Responsible record',

    // Landing Page
    proBadge: 'PRO',
    proTag: 'Audited Bankroll Tracking · Live ESPN & MLB sync',
    heroTag: 'WNBA, NBA, NFL & SOCCER · VERIFIED CONTROL PER MATCH',
    heroTitle1: 'Bet tracking that',
    heroTitle2: 'holds accountability.',
    heroDesc: 'Track every wager with official ESPN and MLB feeds, manage bookmaker balances, and audit real profitability before and after each game. Immutable. Zero bias.',
    ctaStart: 'Get started free',
    ctaOverview: 'Open dashboard',
    howModelWorks: 'How the model works',
    auditedCalib: 'AUDITED CALIBRATION',
    viewCalibration: 'View win tracking',
    liveBankControl: 'Live Bankroll Management',
    multiBookieTag: 'Multi-bookie · MXN & USD',
    consolidatedBank: 'Consolidated Bankroll',
    consolidatedSub: 'Available + pending in-play wagers',
    netYield: 'Yield / ROI',
    netYieldSub: 'Real return on investment',
    available: 'Available',
    inPlay: 'In play',
    winRate: 'Win rate',
    methodology: 'AUDITED METHODOLOGY',
    methodologyTitle1: 'Everything that matters.',
    methodologyTitle2: 'Without number confusion.',
    methodologyDesc: 'Engineered for sharp bettors seeking long-term profitability driven by data and bankroll discipline.',
    feature1Title: 'Track Every Bookmaker',
    feature1Desc: 'Add your sportsbooks, track deposits, withdrawals, and monitor your currency exposure in real time.',
    feature2Title: 'Official Data & Odds',
    feature2Desc: 'Access live scores from ESPN, MLB, and NFL. Link odds, spreads, player props, or parlays with zero calculation errors.',
    feature3Title: 'Audit Real Performance',
    feature3Desc: 'Spot exactly which leagues and markets yield profits, follow bankroll challenges, and enforce stop-loss discipline.',
    feature4Title: 'Verifiable Public Record',
    feature4Desc: 'Share a cryptographically verifiable public page to prove your genuine track record to followers or investors.',
    feature5Title: 'Props & (+EV) Probabilities',
    feature5Desc: 'Access official Bet365 & DraftKings odds, implied probabilities, and live player performance stats.',
    feature6Title: 'Bankroll Discipline & Stop-Loss',
    feature6Desc: 'Protect your bankroll with strict sizing rules and smart alerts whenever you exceed recommended limits.',
    ageWarningTitle: 'Responsible bankroll management starts with limits.',
    ageWarningDesc: 'Betting is strictly 18+. You can lose the money you wager. BetRegister is a bankroll tracker and statistical analytical tool: it does not take wagers nor guarantee profits. Set clear limits and never wager essential living funds.',
    ctaBottomTitle1: 'Your next betting edge begins',
    ctaBottomTitle2: 'with understanding your track record.',
    ctaBottomDesc: 'Start tracking today. Zero hidden fees.',

    // Auth Page
    authCreateTitle: 'Create your account',
    authCreateSubtitle: 'Enter your email and create a password to begin.',
    authLoginTitle: 'Welcome back',
    authLoginSubtitle: 'Sign in to your audited betting workspace.',
    authEmail: 'Email address',
    authPassword: 'Password',
    authConfirmPassword: 'Confirm password',
    authMinChars: 'Minimum 10 characters',
    authAdultConfirm: 'I confirm that I am 18 years or older.',
    authTermsConfirm: 'I accept the Terms of Service and Privacy Policy.',
    authTerms: 'Terms of Service',
    authPrivacy: 'Privacy Policy',
    authSubmitCreate: 'Create my account',
    authSubmitLogin: 'Sign in',
    authHasAccount: 'Already have an account?',
    authNoAccount: "Don't have an account yet?",
    authGoLogin: 'Sign in here',
    authGoRegister: 'Create new account',
  },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly lang = signal<Language>('es');

  readonly t = computed(() => TRANSLATIONS[this.lang()]);

  constructor() {
    try {
      const saved = localStorage.getItem('betregister_lang') as Language;
      if (saved === 'es' || saved === 'en') {
        this.lang.set(saved);
      }
    } catch {}
  }

  setLang(l: Language) {
    this.lang.set(l);
    try {
      localStorage.setItem('betregister_lang', l);
    } catch {}
  }

  toggleLang() {
    this.setLang(this.lang() === 'es' ? 'en' : 'es');
  }
}
