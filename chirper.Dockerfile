# syntax=docker/dockerfile:1

# Build the application from source
FROM golang:1.23.3 AS build-stage

WORKDIR /app

COPY . .
RUN go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd

# Run the tests in the container
FROM build-stage AS run-test-stage
RUN go test -v ./...

# Deploy the application binary into a lean image
FROM alpine:3.19.4 AS build-release-stage

WORKDIR /

COPY --from=build-stage /app/server /app/server
COPY --from=build-stage /app/migrations /app/migrations
RUN mkdir /app/db && chmod -R 777 /app/db && cd /app

ENV PORT=80

ENTRYPOINT ["/bin/sh", "-c", "cd /app && ./server"]