# Backend API Documentation - Pithi Digital

Complete REST API endpoints for Pithi Digital backend.

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 📌 Auth Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2026-03-25T00:00:00Z",
    "updatedAt": "2026-03-25T00:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2026-03-25T00:00:00Z",
    "updatedAt": "2026-03-25T00:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 Users Endpoints

### Get Current User Profile
```http
GET /api/users/me
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "email": "john@example.com",
  "events": [...]
}
```

---

### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <jwt_token>
```

---

## 🎉 Events Endpoints

### Create Event
```http
POST /api/events
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Wedding Celebration",
  "type": "WEDDING",
  "date": "2026-06-15T18:00:00Z",
  "location": "Phnom Penh, Cambodia",
  "description": "A beautiful wedding celebration",
  "coverImage": "image_url_here"
}
```

**Response (201):**
```json
{
  "id": "event_id_here",
  "title": "Wedding Celebration",
  "type": "WEDDING",
  "date": "2026-06-15T18:00:00Z",
  "location": "Phnom Penh, Cambodia",
  "description": "A beautiful wedding celebration",
  "userId": "user_id_here",
  "createdAt": "2026-03-25T00:00:00Z",
  "updatedAt": "2026-03-25T00:00:00Z",
  "guests": []
}
```

---

### Get All Events (Current User)
```http
GET /api/events?skip=0&take=10
Authorization: Bearer <jwt_token>
```

**Response (200):** Array of events

---

### Get Event by ID
```http
GET /api/events/:id
Authorization: Bearer <jwt_token>
```

---

### Get Event Statistics
```http
GET /api/events/:id/stats
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "totalGuests": 50,
  "accepted": 35,
  "declined": 5,
  "pending": 10
}
```

---

### Update Event
```http
PUT /api/events/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "location": "Bangkok, Thailand"
}
```

---

### Delete Event
```http
DELETE /api/events/:id
Authorization: Bearer <jwt_token>
```

**Response (200):** Deleted event object

---

## 👫 Guests Endpoints

### Add Guest to Event
```http
POST /api/guests/:eventId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Guest Name",
  "email": "guest@example.com",
  "phone": "+855987654321"
}
```

**Response (201):**
```json
{
  "id": "guest_id_here",
  "name": "Guest Name",
  "email": "guest@example.com",
  "phone": "+855987654321",
  "status": "PENDING",
  "eventId": "event_id_here",
  "createdAt": "2026-03-25T00:00:00Z",
  "updatedAt": "2026-03-25T00:00:00Z"
}
```

---

### Get All Guests for Event
```http
GET /api/guests/event/:eventId?skip=0&take=50
Authorization: Bearer <jwt_token>
```

**Response (200):** Array of guests with invitation details

---

### Get Single Guest
```http
GET /api/guests/:id
Authorization: Bearer <jwt_token>
```

---

### Update Guest RSVP Status (PUBLIC - No Auth Required)
```http
PUT /api/guests/:id/status
Content-Type: application/json

{
  "status": "ACCEPTED"
}
```

**Valid statuses:** `PENDING`, `ACCEPTED`, `DECLINED`

**Response (200):** Updated guest with event details

---

### Delete Guest
```http
DELETE /api/guests/:id
Authorization: Bearer <jwt_token>
```

---

### Get Guest by Invitation Link (PUBLIC - No Auth Required)
```http
GET /api/guests/invitation/:uniqueLink
```

**Response (200):**
```json
{
  "id": "invitation_id_here",
  "uniqueLink": "invitation_link_here",
  "qrCode": "qr_code_here",
  "guest": {
    "id": "guest_id_here",
    "name": "Guest Name",
    "email": "guest@example.com",
    "phone": "+855987654321",
    "status": "PENDING",
    "event": {
      "id": "event_id_here",
      "title": "Wedding Celebration",
      "date": "2026-06-15T18:00:00Z",
      "location": "Phnom Penh, Cambodia"
    }
  }
}
```

---

## 🚀 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Create Event (Replace TOKEN)
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wedding",
    "type": "WEDDING",
    "date": "2026-06-15T18:00:00Z",
    "location": "Phnom Penh, Cambodia"
  }'
```

---

## 📊 Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "BadRequest"
}
```

### Common Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation failed)
- **401** - Unauthorized (needs login)
- **403** - Forbidden (no permission)
- **404** - Not Found
- **409** - Conflict (duplicate email)
- **500** - Internal Server Error

---

## 🔑 JWT Token Structure

The JWT token contains the following payload:
```json
{
  "sub": "user_id_here",
  "email": "john@example.com",
  "role": "USER",
  "iat": 1700000000,
  "exp": 1700604800
}
```

---

## 📝 Environment Variables Required

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

---

## 🎯 Next Steps

- Test all endpoints with Postman or Insomnia
- Setup invitation system with QR codes (Phase 5-6)
- Implement file upload with Cloudinary (Phase 7)
- Add admin dashboard endpoints (Phase 9)

Last Updated: March 25, 2026
