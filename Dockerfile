# Stage 1: Build Node.js application
FROM node:14 AS node_builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Stage 2: Build Redis
FROM redis:latest AS redis_builder

# Optionally, add custom Redis configuration files or scripts here

# Stage 3: Final stage with both Node.js and Redis
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy the Node.js application from the first stage
COPY --from=node_builder /app ./

# Expose the Redis port (6379) if needed
EXPOSE 6379

# Expose any other ports needed by your Node.js application
EXPOSE 3000

# Command to start the Node.js application
CMD ["node", "src/app.js"]

