FROM node:19-alpine3.16
RUN npm install -g pnpm
WORKDIR /app
COPY entry.sh /tmp/
RUN chmod +x /tmp/entry.sh