# Poner la Copa APDES en vivo

## 1. Crear tablas nuevas en Neon

El error con `matches` ocurre porque tu base ya tiene una tabla con ese nombre y otra estructura. La app ahora usa nombres propios y no toca nada existente:

- `copa_matches`
- `copa_match_events`

En Neon:

1. Abri **SQL Editor**.
2. Ejecuta completo [`database/setup.sql`](./database/setup.sql).

El script solo crea tablas vacias. No carga partidos falsos.

## 2. Configurar la clave del administrador

En Vercel, en **Project Settings > Environment Variables**, deja tu `DATABASE_URL` actual y agrega:

```env
ADMIN_PASSWORD=una_clave_segura_que_solo_tenga_la_organizacion
```

Luego hace un nuevo deploy.

## 3. Cargar partidos reales

1. Entra a `/admin`.
2. Ingresa `ADMIN_PASSWORD`.
3. Usa el bloque **Nuevo partido** para escribir equipos, fecha, horario, categoria y cancha.
4. El partido aparece automaticamente en la web.
5. Cuando comience, seleccionalo y usa la planilla para iniciar reloj, cargar goles o tarjetas y finalizarlo.

La home, Estadisticas y Mi Colegio muestran solo los partidos que cargaste.

## Datos sencillos

- `Grupo`: aparece en fixture y alimenta tabla/estadisticas.
- `Cuartos`, `Semifinal` o `Final`: aparece en la llave.
- `Destacado`: hace que el partido figure en “Partidos a seguir”.

No compartas `ADMIN_PASSWORD` con el publico: habilita la carga y modificacion de resultados.
