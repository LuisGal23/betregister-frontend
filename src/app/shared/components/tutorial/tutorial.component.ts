import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.css',
})
export class TutorialComponent implements AfterViewInit {
  dismiss = output();
  router = inject(Router);
  index = signal(0);
  heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  steps = [
    {
      route: '/overview',
      title: 'Todo empieza en tu resumen',
      text: 'Aquí ves tu bank, resultados y evolución. Cambia Día, Semana o Mes para explorar la gráfica. Los filtros avanzados están en «Filtrar resultados».',
    },
    {
      route: '/bank',
      title: 'Organiza tu dinero por casa',
      text: 'Añade tus casas en «Añadir casa». Cada una tiene su saldo y moneda. Para retirar una casa de tu lista debe quedar en cero y sin operaciones pendientes.',
    },
    {
      route: '/overview',
      title: 'Registra depósitos y retiros',
      text: 'Abre «Depositar o retirar». En esa tarjeta registras movimientos, los confirmas cuando se reflejen en tu casa y consultas el historial. El registro no transfiere dinero.',
    },
    {
      route: '/bets',
      title: 'Elige partidos y arma tu ticket',
      text: 'Selecciona deporte, competición y fecha a la izquierda. Añade partidos y completa tu ticket a la derecha: simple, parlay o combinada del mismo partido. Usa el scroll del ticket si tiene varias selecciones.',
    },
    {
      route: '/bets',
      title: 'Clasifica cada selección',
      text: 'Indica su mercado y línea: goles, córners, carreras, puntos o moneyline. Usa «Otro» solo cuando no exista tu mercado. Estas etiquetas alimentan tu análisis.',
    },
    {
      route: '/bets',
      title: 'Consulta cómo cuidar tu bank',
      text: 'El icono flotante de conversación abre el asistente. Compara tu importe con el 2% disponible de la casa o prueba Kelly fraccional con tu propia probabilidad. Ningún cálculo garantiza ganancias.',
    },
    {
      route: '/bets?view=history',
      title: 'Actualiza tus resultados',
      text: 'En «Mis tickets», abre «Resolver apuesta» para registrar ganada, perdida, anulada o cashout. Los marcadores en vivo son informativos: los resultados del ticket se confirman manualmente.',
    },
    {
      route: '/insights',
      title: 'Entiende tu historial',
      text: 'Pulsa un deporte y después un mercado. Alterna con «Por tipo de apuesta». Abre una fila para ver los tickets que explican el resultado; los pendientes todavía no aportan ganancias.',
    },
    {
      route: '/challenges',
      title: 'Lleva tus retos por separado',
      text: 'Crea un reto y vincula tickets ya registrados para seguir su progreso. No duplica tus movimientos ni cambia el bank. Puedes repetir este recorrido desde el menú.',
    },
  ];
  ngAfterViewInit() {
    void this.go(0);
  }
  async go(value: number) {
    this.index.set(value);
    await this.router.navigateByUrl(this.steps[value].route);
    setTimeout(() => this.heading().nativeElement.focus(), 0);
  }
}
