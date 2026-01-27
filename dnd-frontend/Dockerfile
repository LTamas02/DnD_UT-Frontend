# Builder base installs dependencies and exposes node_modules path for dev.
FROM node:20-alpine AS base

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm ci

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "start"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
