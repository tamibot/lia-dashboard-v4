# 🧪 09: GUIA DE QA Y PLAYGROUND (ULTRA DETAIL V4)

## 🎯 Capa de Aseguramiento (Ground Truth)

El Playground de LIA no es solo un chat; es un motor de **Inferencia Grounded** que garantiza que los agentes no alucinen información comercial. Utiliza un ciclo de dos pasos para filtrar el catálogo real antes de generar cualquier respuesta.

---

## 🏗️ Ciclo de Inferencia y Grounding (Mermaid)

Este diagrama detalla cómo el sistema pre-procesa la consulta del usuario mediante una "Consulta SQL Simulada" para extraer el contexto exacto del catálogo.

```mermaid
sequenceDiagram
    participant U as Usuario (Playground)
    participant P as SalesPlayground.tsx
    participant G as lib/gemini.ts (chatWithAgent)
    participant AI1 as Gemini (Step 1: SQL Gen)
    participant DB as Catálogo Real (JSON/RAM)
    participant AI2 as Gemini (Step 2: Response)

    U->>P: Envía mensaje: "¿Tienen cursos de IA?"
    P->>G: chatWithAgent(agent, history, msg, context)
    G->>AI1: PROMPTS.SQL_CATALOG_QUERY + userMsg
    AI1-->>G: "SELECT * FROM catalog WHERE category = 'IA'"
    G->>DB: filterCatalogItems(allItems, sqlQuery)
    DB-->>G: Returns: [Curso_IA_01, Curso_IA_02]
    G->>AI2: System Prompt (Identidad + Catálogo Filtrado + Perfil Org)
    AI2-->>G: Genera respuesta basada en DATOS REALES
    G-->>P: Retorna texto grounded
    P-->>U: Muestra respuesta (Grounding OK ✅)
```

---

## 🚦 Máquina de Estados de la Conversación

El sistema monitorea las respuestas de la IA para detectar disparadores (triggers) que cambian el estado del lead de "Interesado" a "Cerrado" o "Transferido".

```mermaid
stateDiagram-v2
    [*] --> CHATTING: Apertura de Playground
    
    CHATTING --> TRANSFERRED: Detección de Keyword "agendado" / "asesor"
    CHATTING --> CLOSED: Detección de Keyword "pago exitoso" / "inscripción"
    CHATTING --> CHATTING: Continuar flujo Sales/FAQ
    
    TRANSFERRED --> [*]: Notificación a CRM (GHL)
    CLOSED --> [*]: Registro de Venta / Acceso Académico
    
    CHATTING: Indicador "LIVE" Activo
    CHATTING: Grounding Monitor OK
```

---

## 🛡️ Cascada de Resiliencia (Multi-Model Failover)

LIA implementa una estrategia de "Zero Downtime" para la IA mediante un sistema de reintentos y cambio de proveedor en caliente.

```mermaid
graph TD
    Trigger[Solicitud de Usuario] --> M1[Gemini 1.5 Flash]
    M1 -- Error 429/500 --> R1[Retry + Expon. Backoff]
    R1 -- Fallo --> M2[Gemini 1.5 Pro]
    M2 -- Fallo --> R2[Retry]
    R2 -- Fallover --> M3[OpenAI GPT-4o-mini]
    M3 -- Éxito --> Out[Respuesta al Usuario]
    M1 -- Éxito --> Out
    M2 -- Éxito --> Out
    
    style M3 fill:#10a37f,color:#fff
    style M1 fill:#4285f4,color:#fff
    style Trigger fill:#f9f9f9
```

---

## 📋 Protocolos de QA Técnico

### 1. Validación de Inyección de Contexto (Grounding)

- **Check**: El agente no debe mencionar precios o cursos que no existan en el `SalesPlayground` Indicator.
- **Protocolo**: Enviar "¿Tienen cursos de Cocina?" cuando el catálogo solo tiene "IA". La respuesta DEBE ser negativa o referencial al catálogo real.

### 2. Sincronización GHL (Webhooks)

- **Check**: Cada cierre en el Playground debe generar una nota o un cambio de etapa en GoHighLevel.
- **Protocolo**: Verificar Logs de Railway para la ruta `POST /sync/ghl` tras una simulación de venta.

### 3. Pipeline de Pruebas "Smoke"

```mermaid
graph LR
    Auth[Auth Study] --> API[Health Check API]
    API --> Agent[Agent Readiness]
    Agent --> Sync[GHL Handshake]
    Sync --> UI[Visual Load]
    UI --> PASS((READY FOR PROD))
    
    style PASS fill:#00c853,color:#fff
```

---

## 🚀 Recomendaciones de Evolución

| Feature | Impacto | Estado Técnico |
| :--- | :--- | :--- |
| **Prompt Registry** | Alta (Trazabilidad) | Sugerido |
| **Vector Search (RAG)** | Media (Precisión) | En Roadmap |
| **Vertex AI Migration** | Alta (Escalabilidad) | Planificado |
| **LLM Evaluation (ragas)** | Media (Calidad) | Nuevo |

---

## 🔗 Navegación

- [Ir al Índice Maestro](./00_MASTER_INDEX.md)
- [Revisar Agentes IA (03)](./03_AGENTES_IA_Y_ORQUESTACION.md)
- [Siguiente: Roadmap (10)](./10_ROADMAP_ESTRATEGICO.md)

---
*LIA Atlas v15.4 - Estandarizando la Calidad Educativa con IA*
