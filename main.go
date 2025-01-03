package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
  "os"
  "strconv"

	"github.com/gin-gonic/gin"
	"io/fs"

	"github.com/joho/godotenv"
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

func main() {
	port := 3000

	mux := http.NewServeMux()

	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	mux.Handle("/api/", http.StripPrefix("/api", r))

	staticFS := fs.FS(staticFiles)
	staticContent, err := fs.Sub(staticFS, "dist")
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(staticContent))
	mux.Handle("/", fileServer)

	err = http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
	if err != nil {
		log.Println(err)
	}
}
