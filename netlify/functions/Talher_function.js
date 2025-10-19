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

    // Activar workflow una sola vez pasando todas las líneas
    const privateRepo = "Avalonia-talher/repo_priv_talher";
    const workflowId = "Talher_WFW.yml";
    const workflowUrl = `https://api.github.com/repos/${privateRepo}/actions/workflows/${workflowId}/dispatches`;

    const payload = {
      ref: "main",
      inputs: {
        solicitudes: JSON.stringify(data.lineas), // enviamos todas las líneas
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
      throw new Error("Error al activar workflow: " + text);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Workflow activado para todas las líneas." }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
  }
}

