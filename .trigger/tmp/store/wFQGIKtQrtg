import {
  task
} from "../../../../chunk-X4R7EAUX.mjs";
import "../../../../chunk-WZGQJWAS.mjs";
import {
  __name,
  init_esm
} from "../../../../chunk-FUV6SSYK.mjs";

// src/trigger/crop-image-task.ts
init_esm();
var cropImageTask = task({
  id: "crop-image-task",
  retry: { maxAttempts: 1 },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { imageUrl, xPercent, yPercent, widthPercent, heightPercent, nodeId, workflowRunId } = payload;
    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.arrayBuffer();
    const authKey = process.env.TRANSLOADIT_KEY;
    const formData = new FormData();
    formData.append("params", JSON.stringify({
      auth: { key: authKey },
      steps: {
        ":original": { robot: "/upload/handle" },
        cropped: {
          use: ":original",
          robot: "/image/resize",
          crop_x: `${xPercent}%`,
          crop_y: `${yPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          resize_strategy: "fillcrop",
          imagemagick_stack: "v3.0.0"
        }
      }
    }));
    formData.append("file_1", new Blob([buffer]), "image.jpg");
    const response = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData
    });
    let assembly = await response.json();
    let attempts = 0;
    while (assembly.ok !== "ASSEMBLY_COMPLETED" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(`https://api2.transloadit.com/assemblies/${assembly.assembly_id}`);
      assembly = await poll.json();
      attempts++;
      if (assembly.error) throw new Error(assembly.error);
    }
    const result = assembly.results?.cropped?.[0] || assembly.uploads?.[0] || Object.values(assembly.results || {})?.[0]?.[0];
    if (!result) throw new Error("Crop failed - no output");
    return { output: result.ssl_url || result.url, nodeId, workflowRunId };
  }, "run")
});
export {
  cropImageTask
};
//# sourceMappingURL=crop-image-task.mjs.map
