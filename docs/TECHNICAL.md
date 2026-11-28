# Documentación técnica

## Capas

- `src/model.ts`: entidades y utilidades de fecha. Fechas visibles DD/MM/AAAA; los cortes de día usan America/Mexico_City. Cargas internamente en kg.
- `src/seed.ts`: catálogo y seis rutinas sin datos personales. No incluye cargas de trabajo ni composición corporal del usuario.
- `src/storage.ts`: Dexie, versiones 1 a 3, validación Zod, formato de respaldo y descarga. Estado en `state` y datos binarios de imágenes en `photos`.
- `src/engine.ts`: funciones puras para volumen, series, aproximaciones, comparabilidad, progresión, tendencias y tiempos.
- `src/ui.tsx`: contexto y componentes de formulario; `metrics.tsx`, `charts.tsx` y `ExerciseVisual.tsx`: representación reutilizable.
- Pantallas en módulos independientes. `App.tsx` mantiene el estado y serializa las escrituras. La carga secundaria usa React.lazy.

## Modelos

Profile, Exercise, Planned, Routine, Session, SessionExercise, SetLog, Measurement, Recovery, Photo y Decision son modelos funcionales de esta versión. Algunos conceptos de la especificación se representan anidados: los parámetros de la rutina se copian dentro de SessionExercise; los segmentos de una descendente se anidan en SetLog.

No existe aún una entidad independiente para cada concepto del modelo completo solicitado. La interfaz de almacenamiento actual es local; una futura implementación remota debe separar repositorios, autenticación y autorización sin cambiar las reglas deportivas.

## Persistencia

Cada cambio del contexto produce una copia y se encola para escritura en IndexedDB. Las fotografías usan su propia tabla y las operaciones de restauración se ejecutan en una transacción de ambas tablas. No hay telemetría ni llamadas de API para las funciones principales.

El esquema v3 conserva datos v1/v2. Las nuevas fotografías se guardan como ArrayBuffer y tipo MIME para compatibilidad con WebKit; la lectura también admite Blob históricos. Futuras alteraciones de campos necesitan `.upgrade()` y pruebas con datos previos. No debe borrarse la base durante una actualización PWA.

Limitaciones: no hay resolución de conflictos entre dos pestañas editando al mismo tiempo; evita edición simultánea. La escritura completa del estado deberá normalizarse en tablas adicionales si crece mucho el historial. Un cierre inmediato antes de completar una operación del navegador puede impedir que el último cambio se persista.

## Respaldos

Formato `{app:'IRON TRACK',version:1,exportedAt,data,photos?}`. El validador comprueba tipos, límites, referencias de ejercicios de plantillas e IDs duplicados en colecciones principales. Rechaza múltiples sesiones activas. Se muestra una vista previa y se confirma el reemplazo. No se hace merge.

Fotos incluidas: data URL de imagen generado a partir del Blob local. Fotos omitidas: no se reemplaza la tabla de fotos al restaurar. Los respaldos actuales no están cifrados. No deben publicarse en Git.

## Estadísticas

- Efectivas: estados completados excepto calentamiento/aproximación.
- Series unilaterales: se usa el máximo de conteos por lado, sin sumar izquierda y derecha como dos series del músculo; el tonelaje sí incluye ambos lados registrados.
- Descendentes: una serie principal; todos sus segmentos añaden tonelaje.
- Mancuernas: ambas manos con peso individual multiplican por dos; registros de un lado no se duplican.
- Mapa: series directas, más 0.5 para músculos secundarios si se habilita. Es una heurística fija, no activación medida.
- e1RM: Epley y solo 1–10 repeticiones; no sustituye una prueba real.
- Estimación de duración: 3 s por repetición, descansos entre series, ejecución unilateral doble, 90 s por transición y 20 min generales. Debe refinarse antes de considerarse predicción personalizada.

## PWA

VitePWA genera precaché del código, CSS e iconos. No se cachean datos personales en el service worker: viven en IndexedDB. Las rutas hash no requieren reescrituras del servidor. `registerType:'prompt'` muestra actualización disponible y evita recargas no solicitadas.

## Calidad

Vitest prueba cálculos y persistencia con fake-indexeddb. Playwright usa el build real en Chromium y WebKit. El conjunto revisa sesión, snapshot, medidas, respaldo/restauración, offline y anchuras 360/390/430/768/1024/1440. No equivale a pruebas físicas de iPhone/Android, auditoría médica ni certificación de accesibilidad.

## Campos compatibles añadidos en 0.2.0

`SessionExercise.notes?` guarda el comentario general sin modificar series ni datos del ejercicio del catálogo. `State.sessionTrash?` conserva sesiones retiradas con su fecha de retirada. Ambos campos son opcionales: los estados y respaldos anteriores siguen siendo válidos sin transformación destructiva. No se cambia la versión de IndexedDB ni se borra ninguna tabla. La eliminación solo mueve el ID elegido, y restaurar devuelve el objeto original. Las estadísticas usan `sessions`, de modo que la Papelera queda excluida. Se impide restaurar una sesión activa si ya existe otra. Los respaldos JSON incluyen la Papelera cuando existe; los informes deportivos y CSV no cuentan sus sesiones.
