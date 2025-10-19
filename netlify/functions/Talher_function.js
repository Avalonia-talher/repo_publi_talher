
/**

* Netlify Function: Talher_function.js
* Repositorios implicados:
* * Público:  Avalonia-talher/repo_publi_talher  (registro de solicitudes)
* * Privado:  Avalonia-talher/repo_priv_talher   (.github/workflows/Talher_WFW.yml)
*
* Variable de entorno requerida en Netlify:
* * PRIV_TOKEN : Token de GitHub con permisos de lectura/escritura en ambos repos
    */

export async function handler(event) {
try {
if (event.httpMethod !== "POST") {
return { statusCode: 405, body: "Método no permitido" };
}

```
const token = process.env.PRIV_TOKEN;
if (!token) {
  return { statusCode: 500, body: "Falta la variable PRIV_TOKEN en Netlify." };
}

const data = JSON.parse(event.body);

if (!data.lineas || !Array.isArray(data.lineas) || data.lineas.length === 0) {
  return { statusCode: 400, body: "No se proporcionaron líneas válidas." };
}

// ========================
// 1️⃣ Registrar solicitudes
// ========================
const publicRepo = "Avalonia-talher/repo_publi_talher";
const registroPath = "registro.json";
const registroUrl = `https://api.github.com/repos/${publicRepo}/contents/${registroPath}`;

// Obtener contenido actual (si existe)
const getRes = await fetch(registroUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  },
});

let registroActual = [];
let sha = null;

if (getRes.ok) {
  const contenido = await getRes.json();
  sha = contenido.sha;
  const decoded = Buffer.from(contenido.content, "base64").toString("utf-8");
  registroActual = JSON.parse(decoded);
} else if (getRes.status !== 404) {
  throw new Error(`Error al leer registro.json: ${getRes.status}`);
}

const fecha = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
const nuevasEntradas = data.lineas.map((l) => ({
  linea: l.nombre,
  foto: l.foto,
  fecha,
}));

const actualizado = [...registroActual, ...nuevasEntradas];
const contenidoBase64 = Buffer.from(JSON.stringify(actualizado, null, 2)).toString("base64");

// Subir registro actualizado
const putRes = await fetch(registroUrl, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
  },
  body: JSON.stringify({
    message: `Registro de ${nuevasEntradas.length} solicitudes (${fecha})`,
    content: contenidoBase64,
    sha: sha || undefined,
  }),
});

if (!putRes.ok) {
  const text = await putRes.text();
  throw new Error("Error al guardar registro.json: " + text);
}

// ==========================
// 2️⃣ Activar workflow GitHub
// ==========================
const privateRepo = "Avalonia-talher/repo_priv_talher";
const workflowId = "Talher_WFW.yml"; // asegúrate que coincida exactamente con tu archivo YAML
const workflowUrl = `https://api.github.com/repos/${privateRepo}/actions/workflows/${workflowId}/dispatches`;

const results = [];

for (const linea of data.lineas) {
  const payload = {
    ref: "main",
    inputs: {
      linea_nombre: linea.nombre,
      foto_posicion: linea.foto,
    },
  };

  const wfRes = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!wfRes.ok) {
    const text = await wfRes.text();
    throw new Error(`Error al activar workflow para ${linea.nombre}: ${text}`);
  }

  results.push(`Workflow activado correctamente para ${linea.nombre}`);
}

// ======================
// 3️⃣ Respuesta al HTML
// ======================
return {
  statusCode: 200,
  body: JSON.stringify({
    success: true,
    message: results.join(" | "),
  }),
};
```

} catch (err) {
console.error("Error en Talher_function:", err);
return {
statusCode: 500,
body: JSON.stringify({ success: false, message: err.message }),
};
}
}


