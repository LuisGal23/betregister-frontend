# Organización del frontend

Cada funcionalidad tiene su carpeta en `src/app/features`. Las rutas privadas conservan
sus URLs y usan `loadComponent` para cargar la página cuando se visita.

```text
src/
  app/
    app.ts / app.html / app.css       # Arranque de la aplicación
    app.routes.ts                    # Rutas con carga diferida
    core/
      models/                        # Contrato agregado del dashboard
      services/                      # Cliente API, sesión/estado y tipo de cambio
      guards/                        # Acceso a rutas privadas tras inicializar sesión
    layout/
      shell/                         # Navegación lateral y encabezado
    features/
      landing/pages/                 # Portada pública /
      auth/
        pages/                       # Acceso y registro con transición lateral
        models/
        services/
      overview/
        pages/                       # Resumen
        components/charts/           # Gráficas exclusivas del resumen
        models/
        services/
      bank/
        pages/                       # Casas, saldos y preferencias de moneda
        models/
        services/
      bets/
        pages/                       # Registro, filtros y liquidación
        models/
        services/
      transactions/
        pages/                       # Historial de movimientos
        models/
        services/
      confirmations/
        pages/                       # Registro y confirmación de movimientos
        models/
        services/
    shared/
      components/                    # Iconos, diálogo y resumen de saldos
      models/                        # Moneda y contrato de revisión
      utils/                         # Fechas, conversión y cálculos exactos
  styles/
    tokens.css                       # Colores del tema
    base.css                         # Elementos HTML y formularios
    components.css                   # Primitivas comunes: tablas, botones, paneles
```

## Responsabilidades

- Cada componente tiene archivos `.component.ts`, `.component.html` y `.component.css`.
- Las páginas mantienen sus formularios y filtros localmente. Salir de una página
  destruye su formulario; los datos guardados permanecen en el estado compartido.
- Los servicios de cada funcionalidad reciben objetos tipados y ejecutan sus
  operaciones. No contienen valores de los campos de los formularios.
- `ApiService` centraliza las peticiones, los errores HTTP y los tiempos de espera.
- `LedgerState` mantiene la sesión, el último dashboard y los cálculos compartidos.
  Al completar una escritura, vuelve a consultar los datos al servidor.
- `ExchangeRateService` consulta la referencia pública de monedas.
- Los modelos pertenecen a la funcionalidad que los define. Transacciones reutiliza
  el modelo de movimientos de Confirmaciones en lugar de mantener una copia.
- Los elementos reutilizados por varias páginas viven en `shared`.
- Los estilos de una ruta se mantienen en esa ruta; los estilos comunes van en `styles`.

## Añadir una funcionalidad

1. Crea `features/<nombre>/pages`, `models` y `services` según lo que necesite.
2. Crea un componente standalone con sus archivos HTML, CSS y TS separados.
3. Define los contratos en `models` y las operaciones API en el servicio.
4. Registra su `loadComponent` en `app.routes.ts`.
5. Añade el enlace en `layout/shell/shell.component.ts`.
6. Comprueba `npm.cmd run build` y las pruebas que afecte el cambio.

La reorganización se concentra en Angular. El backend conserva sus endpoints y
la base de datos existente; esta tarea no modifica los saldos guardados.

## Componentes de consulta

- `bets/components/bank-assistant`: panel flotante no modal; inputs de casa, stake y cuota.
- `shared/utils/kelly.utils.ts`: cálculo puro con validación de entradas, probado en Node.
- `overview/components/sport-efficiency`: barras del historial completo.
- `overview/models/sport-efficiency.ts`: clasificación por deporte, sin duplicar tickets mixtos.
- `insights` y `challenges`: páginas, modelos y servicios propios para análisis y retos.
- `core/guards/auth.guard.ts`: espera inicialización de sesión (promesa compartida).

La navegación global vive en shell; ningún componente visual de gestión publica movimientos.
