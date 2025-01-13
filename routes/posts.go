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

type Post struct {
  Id int `json:"id"`
  Date string `json:"date"`
  Text string `json:"text"`
  Lang string `json:"lang"`
  UserId int `json:"user_id"`
}
func Posts(c *gin.Context) {
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
    `SELECT id, date, text, lang, user_id FROM posts
    ORDER BY date DESC`,
  )
	defer rows.Close()
	if err != nil {
    log.Print(err)
    c.Status(http.StatusInternalServerError)
		return
	}
  var posts []Post

	for rows.Next() {
    var id, user_id int
    var date, text, lang string
		err = rows.Scan(&id, &date, &text, &lang, &user_id)
    if err != nil {
      log.Print(err)
      c.Status(http.StatusInternalServerError)
      return
		}
    post := Post{id, date, text, lang, user_id}
    posts = append(posts, post)
	}

  c.JSON(200, posts)
}
