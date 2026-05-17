Hackathon Caribe Tech
Descripción General
Este proyecto consiste en una plataforma serverless desarrollada durante la Hackathon Caribe Tech, enfocada en automatizar procesos escolares y alimentarios mediante inteligencia artificial y WhatsApp.

La solución permite:

Atención automatizada para profesores vía WhatsApp.
Conversión de lenguaje natural a consultas SQL usando IA.
Generación automática de respuestas estructuradas.
Alertas automáticas por alergias alimentarias.
Reportes programados automáticos.
Persistencia temporal de conversaciones.
Arquitectura completamente serverless en AWS.
Tecnologías Utilizadas
Cloud & Backend
Amazon Web Services
AWS Lambda
Amazon API Gateway
Amazon DynamoDB
AWS Systems Manager Parameter Store
Amazon RDS Proxy
Desarrollo
Node.js
Express
Inteligencia Artificial & Mensajería
Twilio
WhatsApp Sandbox
Modelo IA Llama 3.3 8B
Arquitectura del Sistema
Usuario WhatsApp
        ↓
Twilio Sandbox
        ↓
API Gateway
        ↓
Lambda Principal
   ├── Procesamiento IA
   ├── Generación SQL
   ├── Consultas SQL
   ├── Validación de alergias
   ├── DynamoDB Historial
   └── Respuesta WhatsApp
Estructura del Proyecto
project/
│
├── lambdas/
│   ├── main-chatbot/
│   ├── inventory-reports/
│   └── inactivity-reports/
│
├── layers/
│   └── shared-dependencies/
│
├── routes/
├── services/
├── utils/
├── config/
│
├── package.json
└── README.md
Funcionalidades Principales
1. Chatbot Inteligente para Profesores

La Lambda principal se encargó de:

Recibir mensajes desde WhatsApp.
Interpretar lenguaje natural.
Convertir preguntas a SQL mediante IA.
Ejecutar consultas.
Reformatear respuestas para WhatsApp.
Guardar historial conversacional.
Flujo de IA
Paso 1 — Lenguaje Natural → SQL

Ejemplo:

SELECT * FROM students
WHERE classroom = '10A';
Paso 2 — SQL → Respuesta Natural

La IA toma los resultados SQL y genera respuestas legibles para WhatsApp.

Ejemplo:

Los estudiantes del salón 10A son:
- Juan Pérez
- Laura Gómez
- Carlos Ruiz
2. Historial Conversacional

Se utilizó:

Amazon DynamoDB

Para almacenar:

Conversaciones.
Contexto temporal.
Flujo del usuario.
Reinicio Automático

El historial se eliminaba automáticamente cada hora para:

Optimizar costos.
Evitar almacenamiento innecesario.
Mantener conversaciones recientes.
3. Sistema de Alertas Alérgicas
Problema Inicial

El requerimiento inicial proponía consultar la base de datos cada 30 segundos para detectar nuevas compras.

Esto generaba:

Alto consumo de recursos.
Arquitectura poco eficiente.
Consultas constantes innecesarias.
Solución Implementada

Se creó un endpoint dentro de la Lambda principal que funcionaba como receptor de eventos.

Flujo
Nueva Transacción
        ↓
Endpoint Receptor
        ↓
Validación de alergias
        ↓
Notificación automática al padre
Beneficios
Arquitectura orientada a eventos.
Menor consumo computacional.
Mayor velocidad de respuesta.
Escalabilidad mejorada.
4. Lambdas Programadas

Se desarrollaron dos Lambdas adicionales utilizando triggers programados.

Lambda de Inventario
Ejecución

Cada 7 horas.

Función
Validar inventario de kioscos.
Detectar productos bajo mínimo.
Enviar alertas automáticas.
Lambda de Inactividad Alimentaria
Ejecución

Cada 12 horas.

Función
Revisar estudiantes sin compras después de las 12 PM.
Notificar automáticamente a padres.
Seguridad y Gestión de Credenciales

Se utilizó:

AWS Systems Manager Parameter Store

Para almacenar:

Credenciales SQL.
Tokens Twilio.
Variables de entorno.
Configuración sensible.
Conexión SQL Optimizada

La conexión a la base de datos se realizó mediante:

Amazon RDS Proxy
Beneficios
Pool de conexiones.
Menor latencia.
Mayor estabilidad.
Mejor rendimiento serverless.
Lambda Layers

Se creó una Layer compartida para centralizar dependencias.

Dependencias Incluidas
PostgreSQL Client
Librerías SQL
SDK AWS
Dependencias IA
Twilio SDK
Beneficios
Reutilización entre Lambdas.
Despliegues más ligeros.
Mejor mantenimiento.
Variables de Entorno

Ejemplo:

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

OPENAI_API_KEY=
Endpoints Principales
Webhook WhatsApp
POST /webhook/whatsapp

Recibe mensajes desde Twilio.

Endpoint de Alertas
POST /alerts/allergy

Recibe nuevas transacciones para validar alergias.

Despliegue
Requisitos
Node.js 22
AWS CLI
Cuenta AWS
Cuenta Twilio Sandbox
Instalación
npm install
Deploy
serverless deploy

o utilizando AWS SAM/CDK según configuración.

Principales Retos Técnicos
Conversión IA → SQL

Interpretar correctamente lenguaje natural y transformarlo en SQL válido.

Persistencia Temporal

Mantener contexto conversacional eficiente usando DynamoDB.

Optimización de Eventos

Reemplazar polling constante por arquitectura basada en eventos.

Escalabilidad

Diseñar toda la solución bajo arquitectura serverless.

Resultado Final

La plataforma logró:

Automatizar consultas escolares.
Gestionar respuestas inteligentes vía WhatsApp.
Detectar alertas alimentarias críticas.
Generar reportes automáticos.
Reducir costos operativos.
Implementar una arquitectura cloud moderna y escalable.
Autor

Proyecto desarrollado para Hackathon Caribe Tech.

Desarrollado utilizando:

AWS
Node.js
Express
Twilio
DynamoDB
IA Generativa
Arquitectura Serverless
