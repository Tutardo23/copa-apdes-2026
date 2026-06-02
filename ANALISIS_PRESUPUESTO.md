# Análisis de potencial y presupuesto — Copa APDES 2026

## Estado actual del producto

La web ya tiene una base muy buena de **UX/UI y estructura funcional**:

- Home con fixture, tabla, llaves y modal de detalle de partidos.
- Página de estadísticas con ranking, métricas y fair play.
- Página “Mi colegio” para seguimiento por institución.
- Panel admin “planilla en vivo” con cronómetro y carga de eventos.

Sin embargo, hoy todo está conectado a **datos mock hardcodeados** en el frontend. Para pasar a producción real se necesita:

1. Modelo de datos (partidos, eventos, equipos, categorías, jugadoras).
2. Backend/BaaS (autenticación admin + base de datos + permisos).
3. Integración en tiempo real (suscripciones para reflejar goles/tarjetas en vivo).
4. Flujo operativo de carga en cancha (alta disponibilidad + tolerancia a errores).

## Potencial de la web

### Potencial alto (si conectan datos en vivo)

Con la base visual ya construida, el valor principal está en:

- **Engagement en tiempo real** para familias, colegios y organización.
- **Transparencia deportiva** (tabla, goleadoras, fair play, historial).
- **Escalabilidad por torneos**: el mismo producto sirve para futuras ediciones.
- **Producto vendible B2B** a ligas/colegios privados con muy poca adaptación.

### Riesgos a resolver antes de operar “en vivo”

- Caídas de conexión durante partidos.
- Errores humanos de carga (doble gol, jugadora incorrecta, etc.).
- Ausencia de auditoría (quién editó qué y cuándo).
- Falta de validaciones de negocio (estado de partido, cierres por período, etc.).

## Presupuesto recomendado (mercado 2026)

### Referencias de mercado usadas

- Upwork: web developers suelen ubicarse en **USD 15–50/h**.
- Clutch (agencias): franja habitual **USD 25–49/h** y proyectos web frecuentemente por debajo de USD 10k para alcances chicos.
- Vercel Pro: referencia de **USD 20/mes + uso**.
- Supabase Edge Functions: **USD 2 por 1M invocaciones** excedente según plan.

> Nota: Para Argentina conviene presupuestar en **USD** y convertir al tipo de cambio del día de cobro para evitar desfasajes.

### Opción A — MVP funcional en vivo (recomendada)

Incluye:

- Diseño de esquema de datos.
- Integración DB + auth admin.
- CRUD de partidos/eventos.
- Actualización en vivo en Home, Estadísticas y Mi Colegio.
- Reglas de validación básicas + logs mínimos.
- Deploy y handoff.

Rango estimado:

- **80–130 horas**
- **USD 2.000–5.800** (freelance/mini-equipo, según seniority)

### Opción B — Versión profesional para operar torneo completo

Incluye todo el MVP +:

- Roles/permisos finos (carga, supervisor, solo lectura).
- Auditoría completa de cambios.
- Correcciones retroactivas seguras.
- Dashboard operativo y reportes exportables.
- Hardening de performance/seguridad.

Rango estimado:

- **140–240 horas**
- **USD 4.500–12.000**

### Opción C — Producto escalable multi-torneo

Incluye todo lo anterior +:

- Multi-tenant (varios torneos/colegios simultáneos).
- Branding por cliente.
- API pública/privada.
- Métricas avanzadas y automatizaciones.

Rango estimado:

- **260–420 horas**
- **USD 10.000–25.000+**

## Costos mensuales estimados (operación)

- Hosting (Vercel): desde **USD 0** (Hobby) o **USD 20+/mes** (Pro + consumo).
- Backend/DB (Supabase): puede iniciar bajo y crecer por uso.
- Dominio + correo + observabilidad: **USD 10–80/mes** según stack.

Para un torneo colegial típico, una operación inicial razonable suele quedar en:

- **USD 30–200/mes** (si no hay tráfico masivo ni video en vivo).

## Recomendación comercial concreta

Si te pidieron presupuesto hoy, enviaría 3 paquetes:

1. **MVP en vivo**: USD 3.500 (plazo 3–5 semanas).
2. **Operación torneo completa**: USD 6.900 (plazo 6–8 semanas).
3. **Escalable multi-torneo**: desde USD 12.000 (plazo 10+ semanas).

Y aclarar en propuesta:

- Qué incluye / qué no incluye.
- Cantidad de rondas de cambios.
- Soporte post-lanzamiento (ej. 30 días).
- Costos de infraestructura por separado.

## Conclusión

La página **tiene mucho potencial** porque lo más difícil de vender (experiencia visual y claridad del producto) ya está muy bien encaminado. El punto crítico es convertir la app de “demo bonita” a “plataforma operativa en vivo” con datos confiables, permisos y auditoría. Con ese paso, el producto pasa a tener valor real y recurrente.

## Nota específica: propuesta de 300.000 ARS (evento único)

Si el alcance es realmente de **una sola copa** y con operación simple, 300.000 ARS puede servir únicamente como precio de entrada para una entrega muy acotada.

Pero en términos de mercado 2026, suele quedar **por debajo** de un desarrollo completo con backend en vivo.

### Cuándo 300.000 ARS sí puede cerrar

- Ya existe casi todo el sistema y solo hay que hacer ajustes menores.
- No incluye backend robusto ni auditoría.
- No incluye soporte extendido durante el torneo.
- Se limita a carga básica de resultados.

### Cuándo probablemente queda corto

- Si hay que implementar autenticación, permisos y tiempo real serio.
- Si esperan estabilidad operativa y correcciones durante partidos.
- Si quieren métricas, reportes o panel administrativo más sólido.

### Recomendación práctica

- Ofrecer 300.000 ARS como **paquete mínimo** (solo conexión básica + puesta en marcha).
- Cotizar un paquete recomendado superior para operación real (y dejar claro qué incluye cada opción).
- Mantener cláusula de ajuste por tipo de cambio al día de cobro.
