package migrator

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"crypto/sha256"
	"encoding/hex"
	_ "modernc.org/sqlite"
)

var migrationsDir = "./migrations"

type migrationRow struct {
	hash       string
	created_at int64
}

type queryFile struct {
	name       string
	hash       string
	data       string
	created_at int64
}

func Migrate() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := sql.Open(
		"sqlite",
		"./db/sqlite.db?_pragma=busy_timeout(5000)",
	)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(
		ctx,
		`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			hash text NOT NULL,
			created_at numeric
		)`,
	)
	if err != nil {
		log.Fatal(err)
		return
	}

	rows, err := tx.QueryContext(
		ctx,
		`SELECT hash, created_at
    FROM __drizzle_migrations
    ORDER BY created_at ASC`, //FIXME
	)
	if err != nil {
		log.Print(err)
		return
	}
	defer rows.Close()

	var migrations []migrationRow

	for rows.Next() {
		var row migrationRow
		err := rows.Scan(&row.hash, &row.created_at)
		if err != nil {
			log.Print(err)
			return
		}
		migrations = append(migrations, row)
	}
	if err := rows.Err(); err != nil {
		log.Print(err)
		return
	}

	migrations_ran := len(migrations)
	/*
	  for _, row := range migrations {
	    fmt.Printf(
	      "hash: %s; timestamp: %s\n",
	      row.hash,
	      row.timestamp,
	    )
	  }
	*/

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatal(err)
	}

	var queryFiles []queryFile

	for _, e := range entries {
		filename := e.Name()

		num, err := strconv.Atoi(strings.Split(filename, "_")[0])
		if err != nil {
			log.Print(err)
			continue
		}

		path := filepath.Join(migrationsDir, filename)
		data, err := os.ReadFile(path)
		if err != nil {
			log.Print(err)
			continue
		}
		fileInfo, err := os.Stat(path)
		if err != nil {
			log.Print(err)
			continue
		}

		h := sha256.New()
		h.Write(data)
		calculated_hash := hex.EncodeToString(h.Sum(nil))

		if num >= len(queryFiles) {
			queryFiles = append(queryFiles, make([]queryFile, num-len(queryFiles)+1)...)
		}

		queryFiles[num] = queryFile{
			name:       filename,
			hash:       calculated_hash,
			data:       string(data),
			created_at: fileInfo.ModTime().UnixMilli(),
		}
	}

	for i, query := range queryFiles {
		if i < migrations_ran {
			if query.hash != migrations[i].hash {
				// Stacktrace
				for j, query := range queryFiles {
					if j < migrations_ran {
						fmt.Printf("%s: %s;\tdb: %s\n", query.name, query.hash, migrations[j].hash)
					} else {
						fmt.Printf("%s: %s\n", query.name, query.hash)
					}
				}
				log.Fatal("Migrations corrupted")

			}
			continue
		}

		_, err := tx.ExecContext(
			ctx,
			query.data,
		)
		if err != nil {
			log.Fatal(err)
		}

		_, err = tx.ExecContext(
			ctx,
			`INSERT INTO __drizzle_migrations (
        hash, created_at
      ) VALUES (?, ?)`,
			query.hash,
			query.created_at,
		)
		if err != nil {
			log.Fatal(err)
		}
	}

	applied_migrations := len(queryFiles) - migrations_ran
	if applied_migrations > 0 {
		fmt.Printf("Applied %d migrations\n", applied_migrations)
	}

	tx.Commit()
}
