FROM oven/bun:alpine

COPY src /src

RUN cd /src && bun install && bun run build


FROM nginx:stable-alpine3.17-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=0 src/dist /usr/share/nginx/html
