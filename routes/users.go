package routes

import (
  "context"
  "time"
	"log"
	"net/http"
	"database/sql"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

type User struct {
  Tag string `json:"id"`
  Name string `json:"name"`
  Bio string `json:"bio"`
}
func Users(c *gin.Context) {
  ctx, cancel := context.WithTimeout(
    c.Request.Context(),
    15*time.Second,
  )
  defer cancel()

  db, err := sql.Open(
    "sqlite",
    "./db/sqlite.db?_pragma=busy_timeout(15000)",
  )
  if err != nil {
    log.Print(err)
    c.Status(http.StatusServiceUnavailable)
    return
  }
  defer db.Close()

  rows, err := db.QueryContext(
    ctx,
    `SELECT tag, name, bio FROM users`,
  )
	defer rows.Close()
	if err != nil {
    log.Print(err)
    c.Status(http.StatusInternalServerError)
		return
	}
  var users []User

	for rows.Next() {
    var tag, name, bio string
		err = rows.Scan(&tag, &name, &bio)
    if err != nil {
      log.Print(err)
      c.Status(http.StatusInternalServerError)
      return
		}
    user := User{tag, name, bio}
    users = append(users, user)
	}

  c.JSON(200, users)
}
