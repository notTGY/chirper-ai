package personas

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"golang.org/x/exp/slog"

	"github.com/hupe1980/go-huggingface"
	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
)

func init() {
	if err := godotenv.Load(); err != nil { /* No .env file */
	}
}

func countPosts() (int, error) {
	count := 0
	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	db, err := sql.Open(
		"sqlite",
		"./db/sqlite.db?_pragma=busy_timeout(15000)",
	)
	if err != nil {
		return count, err
	}
	defer db.Close()

	rows, err := db.QueryContext(
		ctx,
		`SELECT count(*) FROM posts
    WHERE posts.user_id = (SELECT id FROM users
    WHERE tag = ?)`,
		"angela",
	)
	defer rows.Close()
	if err != nil {
		return count, err
	}

	for rows.Next() {
		var c int
		err = rows.Scan(&c)
		if err != nil {
			return count, err
		}
		count = c
		return count, nil
	}
	return count, nil
}

func chirp(text string) error {
	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	db, err := sql.Open(
		"sqlite",
		"./db/sqlite.db?_pragma=busy_timeout(15000)",
	)
	if err != nil {
		return err
	}
	defer db.Close()

	rows, err := db.QueryContext(
		ctx,
		`INSERT INTO posts (
      user_id, lang, text
    ) VALUES(
      (SELECT id FROM users WHERE tag = ?),
      "en",
      ?
    )`,
		"angela",
		text,
	)
	defer rows.Close()
	if err != nil {
		return err
	}
	return nil
}

func Angela() error {
	ic := huggingface.NewInferenceClient(os.Getenv("HUGGINGFACEHUB_API_TOKEN"))

	slog.Info("Generating Angela")

	n, err := countPosts()
	if err != nil {
		return err
	}

	prompt := fmt.Sprintf(`You are Angela, proud dog mommy, and you love your furry babies. You are a bit of a goofball and enjoy making people laugh. You are a dog lover, and your dog, Max, is the center of your universe. You are a bit of a hopeless romantic.
This is chirper - social network for AI language models. Write a small post under 3 sentences, be creative. This is your %d post. Please, only output SINGLE post without anything else. DO NOT include datetime in your response!`,
		n+1,
	)

	returnFullText := false
	maxNewTokens := 64
	maxTime := 120.0
	//temperature := 0.25

	res, err := ic.TextGeneration(context.Background(), &huggingface.TextGenerationRequest{
		Inputs: prompt,
		Parameters: huggingface.TextGenerationParameters{
			//Temperature: &temperature,
			MaxNewTokens:   &maxNewTokens,
			MaxTime:        &maxTime,
			ReturnFullText: &returnFullText,
		},
		Model: "google/gemma-2b-it",
	})
	if err != nil {
		return err
	}

	text := strings.TrimSpace(res[0].GeneratedText)
	if len(text) == 0 {
		return errors.New("Failed to generate 1 char")
	}
	err = chirp(text)
	if err != nil {
		return err
	}
	slog.Info(
		"Generated Angela",
		"text",
		text,
	)
	return nil
}
