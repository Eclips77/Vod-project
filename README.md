# Event-Driven Video Streaming Platform (VOD) Backend

A production-ready, event-driven backend for a Video on Demand (VOD) platform built with NestJS, MongoDB, RabbitMQ, S3, and FFmpeg.

## Architecture

This system follows **Clean Architecture** (Hexagonal Architecture) within a NestJS Monorepo structure, ensuring strict separation of concerns, scalability, and testability.

### Services

1.  **API Service (`apps/api`)**:
    -   Handles metadata management (MongoDB).
    -   Orchestrates video uploads via S3 Presigned URLs.
    -   Publishes video processing tasks to RabbitMQ.
    -   Implements global error handling and request tracking.

2.  **Worker Service (`apps/worker`)**:
    -   Consumes messages from RabbitMQ (video processing tasks).
    -   Downloads raw video files from S3 using streams.
    -   Transcodes video to HLS (H.264/AAC) using FFmpeg.
    -   Uploads encoded segments and playlists back to S3.
    -   Updates video status and metadata in MongoDB.
    -   Handles retries and Dead Letter Queues (DLQ) for failed jobs.

### Infrastructure (`libs/infrastructure`)

-   **Database**: MongoDB (Mongoose) for metadata storage.
-   **Messaging**: RabbitMQ for asynchronous communication between API and Worker.
-   **Storage**: AWS S3 (SDK v3) for raw and encoded video storage.
-   **Processing**: FFmpeg (via fluent-ffmpeg) for video transcoding.

### Shared Kernel (`libs/core`, `libs/common`)

-   **Core Domain**: Entities (Video), Value Objects, Domain Events.
-   **Common Utilities**: Structured JSON Logger, Global Exception Filters, DTOs with Validation, Request ID Middleware (Trace ID propagation).

## Prerequisites

-   **Node.js**: v18+ (LTS recommended)
-   **Docker & Docker Compose**: For running MongoDB and RabbitMQ locally.
-   **FFmpeg**: Must be installed on the host machine running the Worker service.
    -   `sudo apt install ffmpeg` (Linux)
    -   `brew install ffmpeg` (macOS)
-   **AWS Account**: S3 Bucket and credentials.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/vod-platform.git
    cd vod-platform
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/vod_db

# Messaging
RABBITMQ_URI=amqp://user:password@localhost:5672

# Storage (AWS S3)
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Running the Application

1.  **Start Infrastructure (MongoDB & RabbitMQ)**:
    ```bash
    docker-compose up -d
    ```

2.  **Start API Service**:
    ```bash
    npm run start:dev api
    ```
    The API will be available at `http://localhost:3000`.

3.  **Start Worker Service**:
    ```bash
    npm run start:dev worker
    ```
    The Worker will start listening for messages on the `video_queue`.

## API Endpoints

### 1. Create Video Metadata & Get Upload URL
-   **POST** `/videos`
-   **Body**:
    ```json
    {
      "title": "My Awesome Video",
      "description": "A description of the video."
    }
    ```
-   **Response**:
    ```json
    {
      "id": "uuid-v4",
      "uploadUrl": "https://s3-presigned-url...",
      "key": "raw/uuid-v4"
    }
    ```

### 2. Get Video Details
-   **GET** `/videos/:id`
-   **Response**:
    ```json
    {
      "id": "uuid-v4",
      "title": "My Awesome Video",
      "status": "PENDING", // PENDING, UPLOADING, PROCESSING, COMPLETED, FAILED
      ...
    }
    ```

### 3. Start Video Processing
-   **POST** `/videos/:id/process`
-   **Response**: `202 Accepted`
-   **Description**: Triggers the transcoding workflow via RabbitMQ.

## Testing

Run unit tests (S3 mocking, Worker logic, Controller validation):

```bash
npm test
```

Run test coverage:

```bash
npm run test:cov
```

## Strict Engineering & Code Quality

-   **Strict Mode**: Enabled in `tsconfig.json` (`strict: true`, `noImplicitAny: true`).
-   **Validation**: DTOs validated with `class-validator` and `class-transformer`.
-   **Observability**: Trace IDs are generated in API middleware and propagated to Worker logs via RabbitMQ message headers.
-   **Error Handling**: Centralized exception filter maps domain errors to HTTP responses.
-   **Resilience**: Worker implements retry logic and DLQ strategy for failed messages.

## License

[MIT](LICENSE)
