package swagger

import (
	"embed"
	"html/template"
	"io/fs"
	"net/http"
	_ "path"
	"strings"
)

//go:embed swagger-ui/*
var swaggerFiles embed.FS

type SwaggerConfig struct {
	SwaggerDocURL string
	AuthURL       string
}

// ServeSwaggerUI serves the Swagger UI HTML with injected configuration
func ServeSwaggerUI(config SwaggerConfig) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs, err := fs.Sub(swaggerFiles, "swagger-ui")
		if err != nil {
			http.Error(w, "Failed to access embedded filesystem", http.StatusInternalServerError)
			return
		}

		if r.URL.Path != "/swagger/" && !strings.HasSuffix(r.URL.Path, "/") {
			fileServer := http.FileServer(http.FS(fs))
			r.URL.Path = strings.TrimPrefix(r.URL.Path, "/swagger")
			fileServer.ServeHTTP(w, r)
			return
		}

		tmpl, err := template.New("swagger-ui").Parse(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Swagger UI</title>
				<link rel="stylesheet" href="./swagger-ui.css">
				<script src="./swagger-ui-bundle.js"></script>
				<script src="./swagger-ui-standalone-preset.js"></script>
				<script src="./swagger-initializer.js"></script>
			</head>
			<body>
				<div id="swagger-ui"></div>
				<script>
					window.ui = SwaggerUIBundle({
						url: "{{.SwaggerDocURL}}",
						dom_id: "#swagger-ui",
						deepLinking: true,
						presets: [
							SwaggerUIBundle.presets.apis,
							SwaggerUIStandalonePreset
						],
						layout: "StandaloneLayout"
					});
			
					window.AUTH_URL = "{{.AuthURL}}"; 
				</script>
			</body>
			</html>
		`)

		if err != nil {
			http.Error(w, "Failed to parse Swagger UI template", http.StatusInternalServerError)
			return
		}

		tmpl.Execute(w, config)
	})
}
