const express = require("express");
const swaggerUi = require("swagger-ui-express");
const axios = require("axios");
const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");

const app = express();
const GITHUB_RAW_URL = process.env.GITHUB_RAW_URL || "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/swagger.yaml";

let swaggerDocument = null;

async function loadSwaggerDoc() {
  try {
    const response = await axios.get(GITHUB_RAW_URL, { timeout: 5000 });
    swaggerDocument = yaml.load(response.data);
    console.log("Swagger YAML обновлен.");
  } catch (error) {
    console.error("Ошибка загрузки Swagger YAML:", error);
  }
}

// Первичная загрузка YAML
loadSwaggerDoc();

app.get("/refresh-swagger", async (req, res) => {
  await loadSwaggerDoc();
  if (swaggerDocument) {
    res.json({ success: true, message: "Swagger успешно обновлен!" });
  } else {
    res.status(500).json({ success: false, message: "Ошибка обновления Swagger!" });
  }
});

app.use("/api-docs", swaggerUi.serve, async (req, res, next) => {
  if (!swaggerDocument) {
    await loadSwaggerDoc();
  }
  swaggerUi.setup(swaggerDocument)(req, res, next);
});

app.use("/swagger-ui-custom", express.static(path.join(__dirname, "swagger-ui")));

app.get("/api-docs", (req, res) => {
  const customSwaggerHtml = fs.readFileSync(path.join(__dirname, "swagger-ui", "index.html"), "utf8")
    .replace("</body>", `
      <script>
        function refreshSwagger() {
          fetch('/refresh-swagger')
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                alert('Swagger успешно обновлен!');
                location.reload();
              } else {
                alert('Ошибка обновления: ' + data.message);
              }
            });
        }

        document.addEventListener("DOMContentLoaded", function() {
          let refreshButton = document.createElement("button");
          refreshButton.innerText = "Обновить Swagger";
          refreshButton.style.position = "absolute";
          refreshButton.style.top = "10px";
          refreshButton.style.right = "10px";
          refreshButton.style.zIndex = "1000";
          refreshButton.style.padding = "10px";
          refreshButton.style.background = "#007bff";
          refreshButton.style.color = "#fff";
          refreshButton.style.border = "none";
          refreshButton.style.cursor = "pointer";
          refreshButton.onclick = refreshSwagger;
          document.body.appendChild(refreshButton);
        });
      </script>
      </body>
    `);

  res.send(customSwaggerHtml);
});

app.listen(3000, () => {
  console.log("Swagger UI запущен на http://localhost:3000/api-docs");
});
