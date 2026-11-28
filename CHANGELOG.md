# Cambios

## 0.2.0 — 28/11/2026

Eliminación recuperable de sesiones desde Historial con confirmación y Papelera persistente. Cancelación de entrenamiento, con opción de conservar series como sesión parcial. Comentarios generales por ejercicio, guardados en sesión y visibles/editables en el historial. Navegación al inicio de cada sección, pestaña de progreso y ejercicio. Refuerzo del bloqueo de pellizco y doble toque en captura. Versión visible al pie. Compatibilidad con registros y respaldos anteriores mediante campos opcionales, sin borrar ni reinicializar IndexedDB.

## 0.1.2 — 25/11/2026

Corregido el ancho de los campos nativos de fecha y mes en Safari/iOS para mantenerlos dentro de sus tarjetas, incluido el inicio del ciclo en Mi Coach. Se conserva el selector nativo y el guardado automático.

## 0.1.1 — 25/11/2026

Corregida la escritura de valores numéricos con mínimo (como estatura); indicador real de guardado automático en Perfil; campos móviles de al menos 16 px para evitar zoom al enfocar; bloqueo de gestos de zoom de la interfaz; zonas seguras y controles de 44 px en iPhone Pro Max, incluidos modo instalado y orientación horizontal. El zoom de accesibilidad del sistema sigue bajo control de iOS. No se cambia el esquema ni se elimina información local.

Pruebas nuevas: estatura dígito a dígito, persistencia del perfil, viewport móvil 440 × 956 a escala 3, orientación horizontal, gestos y desplazamiento.

## 0.1.0 — 25/11/2026

Primera implementación local: React, TypeScript estricto, Vite, IndexedDB, PWA y diseño adaptable. Programa de 113 series, registro de sesiones, temporizador, calculadoras, rutinas versionadas en snapshots, progreso, medidas, fotos, mapa muscular, Coach de reglas, recuperación, informes y respaldo/restauración. Configuración inicial de pruebas y despliegue en Pages. Pendientes identificados en ROADMAP.md; primera publicación verificada en GitHub Pages.
