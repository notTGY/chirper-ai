package main

import (
  "embed"
  "log"
  "net/http"
  "fmt"

  "github.com/gin-gonic/gin"
  "io/fs"
)

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
