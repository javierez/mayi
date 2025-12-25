# Filtros de Inbox - Emails Operativos

Este documento define las reglas para filtrar emails operativos en el inbox de Vesta.

## Objetivo

Mostrar solo emails relevantes para la operativa de la agencia:
- Clientes potenciales (compradores/vendedores)
- Bancos (hipotecas, tasaciones)
- Notarías
- Otras agencias (colaboraciones)
- Portales inmobiliarios (leads)

---

## 1. Dominios Permitidos

### Portales Inmobiliarios
```
@idealista.com
@fotocasa.es
@habitaclia.com
@pisos.com
@yaencontre.com
@tucasa.com
@inmobiliaria.com
```

### Bancos
```
@caixabank.com
@santander.es
@kutxabank.es
@bbva.com
@bankinter.com
@sabadell.com
@unicaja.es
@ibercaja.es
@abanca.com
@cajamar.es
@laboral.kutxa.com
```

### Notarías (patrones)
```
@notari*.es
@notari*.com
*notaria*@*
*notario*@*
```

### Tasadoras
```
@tinsa.es
@tasacionesinmobiliarias.com
@tecnitasa.es
@euroval.com
@gesvalt.es
```

### Registros
```
@registradores.org
@registrodelapropiedad.es
```

---

## 2. Keywords en Asunto

### Términos de Compraventa
```
vivienda
piso
apartamento
chalet
casa
inmueble
propiedad
local
oficina
garaje
trastero
parcela
terreno
finca
```

### Términos de Operación
```
compra
venta
alquiler
arrendamiento
hipoteca
financiación
tasación
valoración
escritura
arras
señal
reserva
oferta
contraoferta
```

### Términos Legales/Notariales
```
notaría
notario
firma
escrituración
registro
inscripción
nota simple
certificado
```

### Términos de Leads
```
contacto
interesado
solicitud
consulta
información
visita
cita
```

---

## 3. Exclusiones (Dominios a Ignorar)

### Newsletters y Marketing
```
@mailchimp.com
@sendgrid.net
@mailgun.org
@constantcontact.com
@hubspot.com
@salesforce.com
noreply@*
no-reply@*
newsletter@*
marketing@*
promo@*
```

### Redes Sociales
```
@facebook.com
@linkedin.com
@twitter.com
@instagram.com
@tiktok.com
```

### Servicios Genéricos
```
@google.com
@microsoft.com
@apple.com
@amazon.com
@paypal.com
```

---

## 4. Lógica de Filtrado

```
INCLUIR email SI:
  (dominio_remitente IN dominios_permitidos)
  OR (asunto CONTIENE keywords_operativos)
  AND (dominio_remitente NOT IN dominios_excluidos)
  AND (remitente NOT MATCH patrones_excluidos)
```

### Query de Gmail (aproximada)

```
(from:(@idealista.com OR @fotocasa.es OR @caixabank.com OR @santander.es OR @kutxabank.es OR @bbva.com)
OR subject:(vivienda OR piso OR inmueble OR hipoteca OR escritura OR notaría OR compra OR venta OR alquiler))
-from:(noreply OR newsletter OR marketing)
-from:(@mailchimp.com OR @sendgrid.net)
label:inbox
```

---

## 5. Casos Especiales

### Leads de Portales
Los portales envían leads desde direcciones específicas:
- Idealista: `avisos@idealista.com`, `leads@idealista.com`
- Fotocasa: `leads@fotocasa.es`, `alertas@fotocasa.es`

### Emails de Clientes Directos
Problema: los clientes particulares usan Gmail, Hotmail, etc.
Solución: si el asunto contiene keywords operativos, incluir aunque el dominio sea genérico.

### Respuestas a Conversaciones
Si un email es parte de un thread que ya está marcado como operativo, incluirlo.

---

## 6. Configuración Propuesta

```typescript
// src/lib/constants/inbox-filters.ts

export const INBOX_FILTERS = {
  // Dominios siempre incluidos
  allowedDomains: [
    // Portales
    "idealista.com",
    "fotocasa.es",
    "habitaclia.com",
    "pisos.com",
    // Bancos
    "caixabank.com",
    "santander.es",
    "kutxabank.es",
    "bbva.com",
    "bankinter.com",
    "sabadell.com",
    // Tasadoras
    "tinsa.es",
    "tecnitasa.es",
    // Registros
    "registradores.org",
  ],

  // Keywords que activan inclusión
  subjectKeywords: [
    // Inmuebles
    "vivienda", "piso", "apartamento", "chalet", "casa",
    "inmueble", "propiedad", "local", "garaje", "parcela",
    // Operaciones
    "compra", "venta", "alquiler", "hipoteca", "tasación",
    "escritura", "arras", "oferta", "visita",
    // Legal
    "notaría", "notario", "registro", "firma",
  ],

  // Dominios siempre excluidos
  excludedDomains: [
    "mailchimp.com",
    "sendgrid.net",
    "hubspot.com",
    "facebook.com",
    "linkedin.com",
  ],

  // Patrones de remitente excluidos
  excludedPatterns: [
    "noreply@",
    "no-reply@",
    "newsletter@",
    "marketing@",
    "promo@",
  ],
};
```

---

## 7. Decisiones Tomadas

### Emails personales (Gmail/Hotmail/etc.)
**INCLUIR SIEMPRE**. Los clientes particulares usan estos dominios.
Dominios: gmail.com, googlemail.com, outlook.com, hotmail.com, live.com, yahoo.com, icloud.com

### Agencias colaboradoras
**Sin lista fija**. Detectar por patrones en el email del remitente:
```
inmobiliaria
inmo
realestate
fincas
propert
estate
```

### noreply@
**EXCLUIR siempre**. Se gestionarán aparte de forma automática.
(Leads de portales se capturan por otros medios)

### Lista blanca de contactos
**ACTIVAR**. Permitir marcar contactos que siempre aparezcan.
Se guardará en base de datos por usuario/agencia.

---

## 8. Reglas Finales

```
INCLUIR email SI:
  1. dominio_remitente IN dominios_permitidos (portales, bancos, notarías, tasadoras)

  OR 2. email_remitente CONTIENE patrones_agencias (inmobiliaria, inmo, realestate, fincas, propert)

  OR 3. asunto CONTIENE keywords_operativos (vivienda, piso, hipoteca, etc.)

  OR 4. remitente IN lista_blanca_contactos

EXCLUIR email SI:
  - remitente MATCH patrones_excluidos (noreply, newsletter, marketing, promo)
  - dominio_remitente IN dominios_excluidos (mailchimp, sendgrid, redes sociales)
```

**Prioridad**: Las exclusiones tienen prioridad sobre las inclusiones.

---

## 9. Configuración Final

```typescript
// src/lib/constants/inbox-filters.ts

export const INBOX_FILTERS = {
  // ===================
  // REGLAS DE INCLUSIÓN
  // ===================

  // Dominios siempre incluidos
  allowedDomains: [
    // Cuentas personales (clientes)
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "outlook.es",
    "hotmail.com",
    "hotmail.es",
    "live.com",
    "yahoo.com",
    "yahoo.es",
    "icloud.com",
    "me.com",
    "protonmail.com",
    // Portales inmobiliarios
    "idealista.com",
    "fotocasa.es",
    "habitaclia.com",
    "pisos.com",
    "yaencontre.com",
    "tucasa.com",
    // Bancos
    "caixabank.com",
    "santander.es",
    "kutxabank.es",
    "bbva.com",
    "bankinter.com",
    "sabadell.com",
    "unicaja.es",
    "ibercaja.es",
    "abanca.com",
    "cajamar.es",
    "laboralkutxa.com",
    // Tasadoras
    "tinsa.es",
    "tecnitasa.es",
    "euroval.com",
    "gesvalt.es",
    // Registros
    "registradores.org",
  ],

  // Patrones en email del remitente para detectar agencias
  agencyPatterns: [
    "inmobiliaria",
    "inmo",
    "realestate",
    "fincas",
    "propert",
    "estate",
    "pisos",
    "casas",
    "viviendas",
    "hogares",
  ],

  // Keywords en asunto que activan inclusión
  subjectKeywords: [
    // Tipos de inmueble
    "vivienda", "piso", "apartamento", "chalet", "casa", "adosado",
    "inmueble", "propiedad", "local", "oficina", "nave",
    "garaje", "parking", "trastero", "parcela", "terreno", "finca", "solar",
    // Operaciones
    "compra", "venta", "alquiler", "arrendamiento", "traspaso",
    "hipoteca", "financiación", "tasación", "valoración",
    "escritura", "arras", "señal", "reserva",
    "oferta", "contraoferta", "negociación",
    // Visitas y contacto
    "visita", "cita", "enseñar", "mostrar",
    "interesado", "interesada", "consulta", "información",
    // Legal/notarial
    "notaría", "notario", "firma", "escrituración",
    "registro", "inscripción", "nota simple",
  ],

  // ===================
  // REGLAS DE EXCLUSIÓN
  // ===================

  // Dominios siempre excluidos
  excludedDomains: [
    // Email marketing
    "mailchimp.com",
    "sendgrid.net",
    "mailgun.org",
    "constantcontact.com",
    "hubspot.com",
    "salesforce.com",
    "mailerlite.com",
    "sendinblue.com",
    "getresponse.com",
    // Redes sociales
    "facebook.com",
    "facebookmail.com",
    "linkedin.com",
    "twitter.com",
    "instagram.com",
    "tiktok.com",
    "pinterest.com",
    // Servicios genéricos
    "google.com",
    "youtube.com",
    "spotify.com",
    "netflix.com",
    "amazon.com",
    "apple.com",
  ],

  // Patrones de remitente siempre excluidos
  excludedSenderPatterns: [
    "noreply@",
    "no-reply@",
    "no_reply@",
    "donotreply@",
    "newsletter@",
    "newsletters@",
    "marketing@",
    "promo@",
    "promociones@",
    "ofertas@",
    "info@mailchimp",
    "bounce@",
    "mailer-daemon@",
    "notifications@",
    "notify@",
    "alert@",
    "alerts@",
  ],
};
```

---

## 10. Próximos Pasos

- [x] Definir reglas de filtrado
- [ ] Implementar `src/lib/constants/inbox-filters.ts`
- [ ] Crear función `buildGmailQuery()` para construir query
- [ ] Actualizar `gmail-service.ts` para aplicar filtros
- [ ] Implementar lista blanca de contactos (tabla DB)
- [ ] Testear con cuenta real
