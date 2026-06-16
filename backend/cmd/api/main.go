package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"education-portal/internal/config"
	coursehttp "education-portal/internal/course/adapters/http"
	coursepostgres "education-portal/internal/course/adapters/postgres"
	"education-portal/internal/course/application"
	"education-portal/internal/platform/httpserver"
	"education-portal/internal/platform/postgres"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("loading config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := postgres.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("connecting database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	courseRepo := coursepostgres.NewRepository(db)
	courseService := application.NewCourseService(courseRepo)
	courseHandler := coursehttp.NewHandler(courseService, logger)

	router := httpserver.NewRouter(httpserver.RouterConfig{
		AllowedOrigin: cfg.AllowedOrigin,
		Logger:        logger,
		CourseHandler: courseHandler,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("api listening", "addr", cfg.HTTPAddr)
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("shutting down server", "error", err)
			os.Exit(1)
		}
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("serving api", "error", err)
			os.Exit(1)
		}
	}

	logger.Info("api stopped")
}
