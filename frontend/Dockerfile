# frontend/Dockerfile

# STAGE 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code and build
COPY . ./
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx config and copy our custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copy the built React files from the build stage
# Update 'build' to 'dist' if using Vite instead of Create React App
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]