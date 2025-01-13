package personas

import (
	"time"

	"golang.org/x/exp/slog"
)

func generate() int {
	count := 0
	err := Angela()
	count++
	if err != nil {
		slog.Info("Error during generation", "err", err)
		count--
	}
	return count
}

func Start() {
	slog.Info("Starting personas script")
	frequency := 4 * time.Hour
	for {
		startTime := time.Now()
		n := generate()
		sleepTime := frequency - time.Since(startTime)
		slog.Info("Generated chirps", "count", n)
		if sleepTime > 0 {
			time.Sleep(sleepTime)
		}
	}
}
