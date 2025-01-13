package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/nottgy/chirper-ai/migrator"
	"github.com/nottgy/chirper-ai/personas"
	"github.com/nottgy/chirper-ai/routes"
)

func init() {
	if err := godotenv.Load(); err != nil { /* No .env file */
	}
}

func LoadPort() int {
	defaultPort := 3000
	portStr, exists := os.LookupEnv("PORT")
	if !exists {
		return defaultPort
	}
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return defaultPort
	}
	return port
}

//go:embed dist
var staticFiles embed.FS

func registerStatic(mux *http.ServeMux) {
	staticFS := fs.FS(staticFiles)
	staticContent, err := fs.Sub(staticFS, "dist")
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(staticContent))
	mux.Handle("/", fileServer)
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	migrator.Migrate()

	port := LoadPort()

	mux := http.NewServeMux()

	r := gin.Default()
	r.GET("/ping", routes.Ping)
	r.GET("/users", routes.Users)
	r.GET("/posts", routes.Posts)

	mux.Handle("/api/", http.StripPrefix("/api", r))
	registerStatic(mux)

	go personas.Start()
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
	if err != nil {
		log.Println(err)
	}
}
