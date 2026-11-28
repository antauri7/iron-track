# IRON TRACK — Personal Training System

Aplicación de entrenamiento de fuerza en español de México. Primera versión local funcional, con diseño oscuro y acentos lima, basada en las referencias visuales aportadas. **No se considera completado todo el documento de especificación**: el alcance disponible y las limitaciones se detallan en [ROADMAP.md](ROADMAP.md).

## Funciones disponibles

- Bitácora semanal, metas personales de proceso y progreso por días únicos, sin datos simulados.
- Vista semanal con acceso al historial del día y estado del último respaldo generado.

- Seis rutinas iniciales, con distribución de 18 / 21 / 17 / 20 / 21 / 16 series: 113 en total.
- Crear, editar, duplicar, archivar, reordenar y restaurar rutinas. Las sesiones conservan una copia de su planificación.
- Sesiones eliminables con confirmación y Papelera recuperable; cancelación con conservación opcional como parcial; comentarios generales por ejercicio.
- Sesión activa recuperable, cargas por serie, repeticiones, RIR, RPE opcional, estados, lados, tipos de serie y segmentos descendentes.
- Comparación con la última sesión del mismo ejercicio, equipo y convención de carga.
- Temporizador persistente con fechas absolutas, pausa y ajustes; sonido y vibración opcionales; solicitud de Wake Lock.
- Aproximaciones y discos; conversión de cargas entre kg y lb. Almacenamiento interno de cargas en kg.
- Series reales separadas de planificadas, tonelaje, evolución de cargas, máximas cargas comparables y 1RM estimado (series de hasta 10 repeticiones).
- Medidas parciales, gráficas y promedios semanales de peso; fotografías locales comprimidas, comparación de dos fechas y exportación voluntaria.
- Mapa muscular esquemático de volumen; guía visual anatómica del músculo principal de cada ejercicio.
- Coach de reglas locales: doble progresión, observaciones de tendencia, decisiones explícitas, recuperación voluntaria y variantes archivadas de descarga.
- Ciclo de ocho semanas con fecha editable, calendario mensual, corrección histórica y registro retrospectivo.
- Informes por rangos, CSV, JSON y versión imprimible que puede guardarse como PDF desde el navegador.
- Respaldos con validación de esquema, detección de IDs duplicados, vista previa, confirmación y restauración transaccional.
- PWA con precaché, rutas hash y configuración compatible con subdirectorios de GitHub Pages.

## Desarrollo

Requiere Node.js 24 y npm. Versiones contrastadas con los metadatos de los paquetes y fijadas mediante `package-lock.json`.

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite. No abras `index.html` directamente con `file://`.

```sh
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run preview
```

Las pruebas funcionales se ejecutan sobre `dist` en el puerto 4173. Compila después de cambiar el código. El service worker se genera para producción, no para el servidor de desarrollo.

## Publicación en GitHub Pages

El checkout inicial no tenía archivos ni remoto. La rama de trabajo es `codex/iron-track`, vinculada a `origin/main`.

Aplicación publicada: https://antauri7.github.io/iron-track/

Repositorio: https://github.com/antauri7/iron-track

El primer despliegue mediante GitHub Actions terminó correctamente el 25/11/2026 y la carga de la aplicación se verificó en Opera.

1. Conecta el repositorio de destino, conservando su visibilidad.
2. Integra el código en `main`.
3. En Settings → Pages selecciona **GitHub Actions** como fuente.
4. El workflow `.github/workflows/pages.yml` ejecuta pruebas, compila, verifica Chromium y WebKit y despliega `dist`.
5. Abre la URL HTTPS de Pages y realiza la instalación desde el navegador del teléfono.

No hace falta un backend ni claves de API. `base: './'`, `HashRouter` y el manifiesto relativo permiten servir bajo el subdirectorio del repositorio. Un repositorio privado no garantiza que su GitHub Pages sea privado: revisa el acceso al sitio según tu plan antes de habilitarlo.

## Instalación y uso sin conexión

Carga completamente la aplicación una vez desde HTTPS. El service worker guarda el código y recursos. En Android usa Instalar; en iOS, Compartir → Agregar a inicio. La disponibilidad depende del navegador. La funcionalidad offline se verifica con Playwright; no se ha probado la instalación en un teléfono físico.

Las actualizaciones se presentan mediante un aviso y no borran IndexedDB. El esquema de la base está versionado. No se garantiza sonido o vibración en segundo plano.

## Privacidad, almacenamiento y respaldo

Los datos de perfil se introducen y confirman dentro de la aplicación; no se incluyen datos personales precargados en el código. Los ejemplos de pruebas son sintéticos. No hay analítica, anuncios, credenciales, fotografías del usuario ni integraciones externas en la aplicación. Las referencias científicas son enlaces voluntarios.

IndexedDB almacena el estado y las fotografías. No se almacenan fotografías en localStorage. Los datos pueden perderse al limpiar el navegador, cambiar de origen o dispositivo o utilizar navegación privada. Solicita almacenamiento persistente desde Perfil y exporta respaldos con frecuencia. Cambiar de `localhost` a Pages crea un almacenamiento separado: exporta e importa tus datos para trasladarlos.

En Perfil → Exportar respaldo puedes incluir o excluir fotografías. El respaldo es **JSON sin cifrar** y puede contener información personal. La restauración reemplaza los datos tras validación y confirmación; no fusiona historiales. Si un respaldo no contiene la sección de fotografías, mantiene las fotos existentes.

## Arquitectura

Consulta [docs/TECHNICAL.md](docs/TECHNICAL.md), [docs/COACH.md](docs/COACH.md) y [docs/ASSETS.md](docs/ASSETS.md). La aplicación separa pantallas, modelos, almacenamiento, programa precargado y cálculos. Las pantallas secundarias se cargan por separado; el service worker las precarga para uso offline.

## Evidencia y límites

La aplicación distingue datos registrados, estimaciones y reglas prácticas. El Coach no diagnostica y no cambia rutinas automáticamente. Las clasificaciones musculares son orientativas y editables mediante ejercicios personalizados. El mapa no representa daño muscular, recuperación ni electromiografía.

La sección científica incluye los 20 temas y las siete referencias; su revisión especializada y la vinculación por recomendación requieren trabajo adicional. Consulta [docs/SCIENCE.md](docs/SCIENCE.md) para el estado de verificación. Esta versión necesita las ampliaciones del roadmap antes de considerarse la entrega completa del proyecto.
