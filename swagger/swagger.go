package swagger

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed swagger-ui/*
var swaggerFiles embed.FS

// ServeSwaggerUI serves Swagger UI with proper path resolution
func ServeSwaggerUI() http.Handler {
	fs, err := fs.Sub(swaggerFiles, "swagger-ui")
	if err != nil {
		panic("Failed to create embedded filesystem: " + err.Error())
	}
	return http.FileServer(http.FS(fs))
}
