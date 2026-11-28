# Verificación — 25/11/2026

## Compilación

`npm run build`: aprobada. TypeScript estricto y build Vite con manifiesto, iconos y precaché. Build total aproximado: 1.1 MB sin comprimir. No quedaron avisos de bundles superiores a 500 kB tras dividir pantallas.

## Pruebas unitarias

`npm test`: 19 aprobadas. Cubren distribución de 113 series, volúmenes directos, snapshots, unilateralidad, descendentes, mancuernas, comparabilidad de equipos, doble progresión, aproximaciones, e1RM, temporizador, semana/fecha mexicana, persistencia, validación de respaldos, estimador de tiempo, tendencias y conservación de estado desde esquema v1 a v3.

## Pruebas funcionales

`npm run test:e2e`: 26 aprobadas, 13 en Chromium y 13 en WebKit. Incluyen registro y recuperación de sesión, snapshot tras editar plantilla, navegación y desbordes a 360/390/430/768/1024/1440 px, recarga offline, medidas parciales, exportación/restauración e importación inválida, recuperación e informes, fotografías locales y comparación.

La prueba de fotografías se amplió después de esa ejecución para incluir respaldo y restauración de sus datos binarios; se volvió a ejecutar de forma dirigida en ambos navegadores. Durante la primera ejecución se encontró un fallo Blob/IndexedDB en WebKit, corregido guardando ArrayBuffer y MIME. El formato de lectura mantiene compatibilidad con Blob previos.

## Otras comprobaciones

- `npm audit --audit-level=moderate`: sin vulnerabilidades reportadas al finalizar.
- Revisión visual mediante capturas de escritorio, móvil y entrenamiento activo.
- Inspección de recursos: no se incorporan capturas del usuario, fotos protegidas ni datos personales al build.
- El workflow de Pages se ejecutó correctamente en GitHub: validación y despliegue aprobados. Ejecución: https://github.com/antauri7/iron-track/actions/runs/45677935638
- Aplicación publicada y carga verificada en Opera: https://antauri7.github.io/iron-track/

## No verificado

Instalación en teléfonos físicos, actualización entre dos versiones de producción distintas, todas las variantes del entrenamiento, recuperación tras error de cuota, uso concurrente en pestañas y auditoría completa de accesibilidad. No se presentan como pruebas aprobadas.

## Actualización 0.1.1: iPhone y guardado de perfil

Se añadió una prueba de regresión al introducir estatura dígito por dígito y recuperar el perfil tras recargar. La simulación móvil usa 440 × 956 píxeles CSS y DPR 3, con orientación horizontal adicional; comprueba tamaño de texto, controles de 44 px, ausencia de desborde y cancelación de eventos de zoom sin bloquear el desplazamiento con un dedo. La confirmación de guardado solo aparece tras terminar las escrituras IndexedDB pendientes. No se ha probado físicamente un iPhone 17 Pro Max ni el zoom de accesibilidad del sistema.

## Actualización 0.2.0: sesiones y conservación del historial

Se añadieron cuatro pruebas unitarias para retirada/restauración íntegra de una sesión sin modificar otras tres, respaldos anteriores sin campos nuevos, comentarios y Papelera en respaldo, y prevención de dos sesiones activas. Se añadieron seis flujos funcionales ejecutados en Chromium y WebKit: retirar/restaurar la sesión vacía; cancelar sin alterar tres sesiones anteriores; comentarios por ejercicio tras navegación, recarga y lectura histórica; conservación como parcial; regreso arriba al navegar; cancelación de eventos de pellizco y doble toque conservando el desplazamiento. Los datos son sintéticos y viven en contextos de prueba aislados; no se leen ni modifican los registros del teléfono del usuario. El bloqueo del zoom de accesibilidad del sistema no está bajo control de una web.

## Actualización 0.3.0: bitácora y metas personales

28 pruebas unitarias y 54 funcionales aprobadas localmente en Chromium y WebKit. Las pruebas añadidas cubren conteo por días únicos, exclusión de sesiones vacías/en curso, fechas de semana al cambiar de año, reflexiones con contenido, validación de metas y respaldo con campos nuevos conservando sesiones anteriores. Los flujos verifican guardado tras recargar, creación/edición/archivo/reactivación de metas, exportación/restauración de reflexiones y anchos 360/390/440 con enlace al historial de la fecha. Se conserva el conjunto anterior de pruebas de sesiones, fotografías, offline y seguridad de restauración.
