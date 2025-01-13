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
  UserId int `json:"user_id"`
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
    `SELECT tag, name, bio, id FROM users`,
  )
	defer rows.Close()
	if err != nil {
    log.Print(err)
    c.Status(http.StatusInternalServerError)
		return
	}
  var users []User

	for rows.Next() {
    var user_id int
    var tag, name, bio string
		err = rows.Scan(&tag, &name, &bio, &user_id)
    if err != nil {
      log.Print(err)
      c.Status(http.StatusInternalServerError)
      return
		}
    user := User{tag, name, bio, user_id}
    users = append(users, user)
	}

  c.JSON(200, users)
}
