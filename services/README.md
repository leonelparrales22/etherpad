# Servicios F4 y F6 – Etherpad Modernización

Microservicios para exportación de pads (F4) y gestión de sesiones API (F6) implementados siguiendo el patrón Strangler Fig.

## 1. Requisitos previos

- Node.js 20+
- Docker y Docker Compose
- PostgreSQL (se levanta con Docker Compose)

## 2. Instalación y configuración

### Clonar el repositorio
```bash
git clone <url-del-repo>
cd etherpad
```

### Configurar variables de entorno
Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
# Variables para el monolito (para que no falle la interpolación)
DOCKER_COMPOSE_APP_ADMIN_PASSWORD=admin123

# Variables para PostgreSQL (necesarias para los microservicios)
DOCKER_COMPOSE_POSTGRES_PASSWORD=etherpad
DOCKER_COMPOSE_POSTGRES_USER=etherpad
DOCKER_COMPOSE_POSTGRES_DATABASE=etherpad
DOCKER_COMPOSE_POSTGRES_PORT=5432
```

## 3. Levantar los servicios

### Iniciar PostgreSQL y los microservicios
```bash
docker-compose --env-file .env up -d postgres export-service session-service
```

### Verificar que los servicios están corriendo
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
```

Respuesta esperada:
```json
{"status":"ok","service":"export-service"}
{"status":"ok","service":"session-service"}
```

## 4. Pruebas del Export Service (F4)

### 4.1 Preparar datos de prueba
Conéctate a PostgreSQL e inserta un pad de prueba:

```bash
docker exec -it etherpad-postgres-1 psql -U etherpad -d etherpad
```

Dentro de psql:
```sql
CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value JSONB);
INSERT INTO store (key, value) VALUES ('pad:demo', '{"atext":{"text":"Contenido de prueba para exportación","attribs":"*0*1+6"}}');
\q
```

### 4.2 Probar exportación a HTML
```bash
curl http://localhost:3001/api/export/demo/html
```

Respuesta esperada:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pad Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <pre>Contenido de prueba para exportación</pre>
</body>
</html>
```

### 4.3 Probar otros formatos
```bash
# Texto plano
curl http://localhost:3001/api/export/demo/txt

# Etherpad (JSON)
curl http://localhost:3001/api/export/demo/etherpad

# PDF
curl http://localhost:3001/api/export/demo/pdf -o output.pdf

# DOCX
curl http://localhost:3001/api/export/demo/docx -o output.docx
```

### 4.4 Probar con revisión específica
```bash
# Primero inserta una revisión
docker exec -it etherpad-postgres-1 psql -U etherpad -d etherpad -c "INSERT INTO store (key, value) VALUES ('pad:demo:revs:1', '{\"atext\":{\"text\":\"Revisión 1\"}}')"

# Exporta la revisión
curl http://localhost:3001/api/export/demo/html/1
```

## 5. Pruebas del Session Service (F6)

### 5.1 Preparar datos de prueba
Conéctate a PostgreSQL e inserta grupo y autor:

```bash
docker exec -it etherpad-postgres-1 psql -U etherpad -d etherpad
```

Dentro de psql:
```sql
INSERT INTO store (key, value) VALUES ('group:g.test', '{"name":"Test Group"}');
INSERT INTO store (key, value) VALUES ('author:a.test', '{"name":"Test Author"}');
\q
```

### 5.2 Crear una sesión
```bash
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"groupID":"g.test","authorID":"a.test","validUntil":2000000000}'
```

Respuesta esperada:
```json
{"sessionID":"s.abc123def456"}
```

**Nota:** `validUntil` debe ser un timestamp Unix futuro. `2000000000` ≈ mayo 2033.

### 5.3 Obtener información de una sesión
```bash
curl http://localhost:3002/api/sessions/s.abc123def456
```

Respuesta esperada:
```json
{
  "groupID":"g.test",
  "authorID":"a.test",
  "sessionID":"s.abc123def456",
  "validUntil":2000000000
}
```

### 5.4 Listar sesiones por grupo
```bash
curl http://localhost:3002/api/sessions/group/g.test
```

Respuesta esperada:
```json
{
  "sessions": [
    {
      "groupID":"g.test",
      "authorID":"a.test",
      "sessionID":"s.abc123def456",
      "validUntil":2000000000
    }
  ]
}
```

### 5.5 Listar sesiones por autor
```bash
curl http://localhost:3002/api/sessions/author/a.test
```

### 5.6 Eliminar una sesión
```bash
curl -X DELETE http://localhost:3002/api/sessions/s.abc123def456
```

Respuesta esperada: `204 No Content` (sin cuerpo)

## 6. Escenarios de error

### 6.1 Pad no encontrado
```bash
curl http://localhost:3001/api/export/pad-inexistente/html
```

Respuesta esperada:
```json
{"error":"Pad pad-inexistente not found"}
```

### 6.2 Tipo de exportación inválido
```bash
curl http://localhost:3001/api/export/demo/xml
```

Respuesta esperada:
```json
{"error":"Invalid export type 'xml'. Valid types: html, txt, etherpad, pdf, docx"}
```

### 6.3 Grupo o autor no existe
```bash
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"groupID":"g.inexistente","authorID":"a.test","validUntil":2000000000}'
```

Respuesta esperada:
```json
{"error":"Group g.inexistente does not exist"}
```

### 6.4 validUntil en el pasado
```bash
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"groupID":"g.test","authorID":"a.test","validUntil":1000000000}'
```

Respuesta esperada:
```json
{"error":"validUntil is in the past"}
```

## 7. Logs y monitoreo

### Ver logs de los servicios
```bash
# Logs de export-service
docker-compose logs -f export-service

# Logs de session-service
docker-compose logs -f session-service

# Logs de todos los servicios
docker-compose logs -f
```

### Ver contenedores corriendo
```bash
docker-compose ps
```

## 8. Detener los servicios

```bash
# Detener pero mantener volúmenes
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar contenedores y volúmenes
docker-compose down -v
```

## 9. Arquitectura

### Export Service (puerto 3001)
- **Generadores:** TxtGenerator, HtmlGenerator, EtherpadGenerator, PdfGenerator, DocxGenerator
- **Patrón:** Strategy para exportación multi-formato
- **Base de datos:** Lee de la tabla `store` (key: `pad:{padId}` o `pad:{padId}:revs:{revNum}`)

### Session Service (puerto 3002)
- **Índices:** `group2sessions:{groupID}`, `author2sessions:{authorID}`
- **Validaciones:** Verifica existencia de grupo y autor, valida timestamp
- **Base de datos:** Lee/escribe en la tabla `store` (key: `session:{sessionID}`)

## 10. Troubleshooting

### Error de autenticación PostgreSQL
Si ves `password authentication failed for user "admin"`, verifica que tu archivo `.env` tenga:
```env
DOCKER_COMPOSE_POSTGRES_USER=etherpad
```

Y recrea los contenedores:
```bash
docker-compose down -v postgres
docker-compose up -d postgres
docker-compose up -d --force-recreate export-service session-service
```

### Servicios no responden
Verifica que los contenedores estén corriendo:
```bash
docker-compose ps
```

Reinicia si es necesario:
```bash
docker-compose restart export-service session-service
```

### Build falla con errores de TypeScript
Los errores de TypeScript en el IDE son normales si no has ejecutado `npm install` localmente. En Docker, las dependencias se instalan automáticamente durante el build.
