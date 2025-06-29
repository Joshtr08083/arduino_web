FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY entrypoint.sh ./

COPY . .

EXPOSE 8080
EXPOSE 8082

RUN chmod +x entrypoint.sh && \
    addgroup -g 1001 appgroup && \
    adduser -D -H -s /bin/sh -u 1001 -G appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

ENTRYPOINT ["./entrypoint.sh"]