
/**
* Netlify Function: Talher_function.js
* Repositorio privado: Avalonia-talher/repo_priv_talher (.github/workflows/Talher_WFW.yml)
* Variable de entorno requerida: PRIV_TOKEN
*/

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Método no permitido" };
    }

    const token = process.env.PRIV_TOKEN;
    if (!token) {
      return { statusCode: 500, body: "Falta la variable PRIV_TOKEN en Netlify." };
    }

    const data = JSON.parse(event.body);
    if (!data.lineas || !Array.isArray(data.lineas) || data.lineas.length === 0) {
      return { statusCode: 400, body: "No se proporcionaron líneas válidas." };
    }

    const privateRepo = "Avalonia-talher/repo_priv_talher";
    const workflowId = "Talher_WFW.yml";
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: results.join(" | "),
      }),
    };

  } catch (err) {
    console.error("Error en Talher_function:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
}


