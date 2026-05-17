# BioAlert

MVP serverless desarrollado para la Hackathon Caribe Tech 2026 sobre la plataforma Biofood.

BioAlert agrega capacidades conversacionales y automatizaciones inteligentes vía WhatsApp utilizando AWS Lambda, Twilio Sandbox y modelos LLM en AWS.

# Objetivo

Transformar las transacciones existentes de cafeterías escolares en:

- respuestas conversacionales,
- alertas automáticas,
- detección de alérgenos,
- alertas de ausencia de consumo,
- alertas de stock crítico,
- y proyecciones simples de saldo.

Todo el sistema fue diseñado completamente sobre infraestructura serverless en AWS.

# Arquitectura General

```text
WhatsApp (Twilio Sandbox)
        ↓
API Gateway (AWS)
        ↓
AWS Lambda (Node.js 22 + Express)
        ↓
 ├── PostgreSQL (Biofood DB)
 ├── DynamoDB (historial y sesiones)
 ├── AWS Bedrock / LLM
 ├── AWS Systems Manager (SSM)
 └── Twilio API
```

# Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express |
| Infraestructura | AWS Lambda |
| API pública | API Gateway |
| Base de datos principal | PostgreSQL |
| Historial conversacional | DynamoDB |
| Canal WhatsApp | Twilio Sandbox |
| IA conversacional | AWS Bedrock (Llama 3.3 8B) |
| Secrets | AWS SSM Parameter Store |
| Automatizaciones | EventBridge / Lambdas programadas |

# Funcionalidades implementadas

## 1. Chatbot conversacional para padres

Los padres pueden consultar información del estudiante usando lenguaje natural vía WhatsApp.

### Ejemplos

- “¿Qué comió mi hijo hoy?”
- “¿Cuándo se le acaba el saldo?”
- “¿Cuánto ha gastado esta semana?”

### Flujo

1. Twilio recibe mensaje WhatsApp.
2. API Gateway redirige al webhook Lambda.
3. El mensaje se convierte a SQL mediante IA.
4. PostgreSQL ejecuta la consulta.
5. La respuesta se vuelve a estructurar usando IA.
6. Se responde al usuario vía Twilio.

## 2. Historial conversacional

Se utilizó DynamoDB para:

- guardar historial de conversaciones,
- mantener contexto conversacional,
- manejar flujo de interacción.

La información tenía TTL automático y se reiniciaba periódicamente para mantener el MVP liviano.

## 3. Alertas de alérgenos en tiempo real

Se implementó un endpoint especializado para recibir eventos de nuevas transacciones.

Cuando una compra contenía un alérgeno registrado para el estudiante:

- se detectaba inmediatamente,
- y se notificaba automáticamente al padre vía WhatsApp.

Esto reemplazó la idea inicial de hacer polling constante sobre la base de datos, reduciendo complejidad y consumo innecesario.

## 4. Alertas automáticas programadas

### Ausencia de consumo

Ejecutada diariamente después del mediodía.

Detecta estudiantes que no registraron compras y notifica al padre.

### Stock crítico

Ejecutada diariamente temprano en la mañana.

Detecta productos por debajo del stock mínimo y notifica administradores de cafetería.

# Sobre este repositorio

Este repositorio contiene principalmente:

- código fuente de las AWS Lambda,
- lógica conversacional,
- automatizaciones,
- integración con Twilio,
- y documentación técnica del MVP.

Debido a que toda la infraestructura fue desplegada directamente en AWS:

- no es posible ejecutar el proyecto completamente de forma local,
- ni desplegarlo únicamente con este repositorio.

Para funcionamiento completo se requerían:

- recursos AWS activos,
- configuración de API Gateway,
- credenciales en SSM,
- Twilio Sandbox,
- DynamoDB,
- PostgreSQL,
- y permisos IAM específicos.

Aun así, se entrega el código completo de las Lambdas y la estructura lógica utilizada durante la hackathon para fines académicos y de evaluación.

# Variables y servicios externos

Las Lambdas consumían secrets desde AWS Systems Manager (SSM):

- credenciales PostgreSQL,
- tokens Twilio,
- configuración Bedrock,
- variables de entorno,
- endpoints.

# Decisiones técnicas importantes

- Arquitectura 100% serverless.
- Sin frontend web.
- Sin microservicios.
- Sin autenticación tradicional.
- WhatsApp funciona como identidad del usuario.
- SQL crudo para velocidad y simplicidad.
- DynamoDB usado únicamente para contexto conversacional.
- Lambdas separadas por responsabilidad.
- Infraestructura optimizada para demo funcional en hackathon.

# Alcance del MVP

## Incluye

- chatbot conversacional,
- alertas automáticas,
- detección de alérgenos,
- proyección de saldo,
- alertas de stock.

## No incluye

- frontend web,
- dashboards,
- multi-tenant,
- autenticación compleja,
- modelos ML entrenados personalizados.

# Contexto Biofood

Biofood es una plataforma de gestión de cafeterías escolares que ya incluye funcionalidades relacionadas con:

- control nutricional,
- inventarios,
- control de consumo,
- recargas,
- y asistentes virtuales para padres.

BioAlert fue desarrollado como una extensión experimental orientada a automatización conversacional e inteligencia operativa sobre la infraestructura existente.

# Estado del proyecto

Proyecto desarrollado como MVP funcional para Hackathon Caribe Tech 2026.

Diseñado para demostración técnica y validación rápida de producto.
