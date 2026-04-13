# 🚗 ParkEase Backend API

Express.js backend for managing parking requests between users and land owners.

## 📋 Features

✅ **User Parking Requests** - Users can request parking from land owners  
✅ **Land Owner Dashboard** - View all pending parking requests  
✅ **Approve/Reject** - Land owner can approve or reject requests  
✅ **Booking History** - Track all bookings and requests  
✅ **Real-time Data** - Supabase integration for live updates  

---

## 🔧 Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the Backend folder:

```
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
NODE_ENV=development
```

Get your Supabase credentials from: https://app.supabase.com

### 3. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs at: `http://localhost:5001`

---

## 📡 API Endpoints

### 1️⃣ USER: Request Parking

**POST** `/api/bookings/request`

Send a parking request to a land owner.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "spot_id": "uuid-of-spot",
  "vehicle_number": "UP 14 AB 1234",
  "vehicle_type": "Car",
  "vehicle_brand": "Maruti Swift",
  "vehicle_color": "White",
  "booking_date": "2025-03-20",
  "start_time": "09:00",
  "end_time": "17:00",
  "booking_type": "hourly",
  "amount": 300,
  "notes": "Need covered parking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Parking request sent to land owner",
  "booking": {
    "id": "booking-uuid",
    "status": "pending",
    "created_at": "2025-03-20T10:30:00Z"
  }
}
```

---

### 2️⃣ LAND OWNER: Get Pending Requests

**GET** `/api/bookings/pending-requests`

Get all pending parking requests for your spots.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "requests": [
    {
      "id": "booking-uuid",
      "vehicle_number": "UP 14 AB 1234",
      "vehicle_type": "Car",
      "vehicle_brand": "Maruti Swift",
      "vehicle_color": "White",
      "user_name": "Rahul Raj",
      "user_phone": "9876543210",
      "booking_date": "2025-03-20",
      "start_time": "09:00",
      "end_time": "17:00",
      "amount": 300,
      "status": "pending",
      "spots": {
        "name": "Front Yard – Spot A",
        "address": "123, Main Road"
      },
      "created_at": "2025-03-20T10:30:00Z"
    }
  ]
}
```

---

### 3️⃣ LAND OWNER: Approve Request

**PUT** `/api/bookings/approve/:booking_id`

Approve a parking request and change status to "active".

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Parking request approved ✓",
  "booking": {
    "id": "booking-uuid",
    "status": "active",
    "payment_status": "pending"
  }
}
```

---

### 4️⃣ LAND OWNER: Reject Request

**PUT** `/api/bookings/reject/:booking_id`

Reject a parking request.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Body:**
```json
{
  "reason": "Spot already booked"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Parking request rejected ✗",
  "booking": {
    "id": "booking-uuid",
    "status": "cancelled"
  }
}
```

---

### 5️⃣ LAND OWNER: Get All Bookings

**GET** `/api/bookings/my-bookings?status=active`

Get all bookings for your spots (optional: filter by status).

**Query Parameters:**
- `status` - Filter by: `pending`, `active`, `completed`, `cancelled`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "bookings": [...]
}
```

---

### 6️⃣ USER: Get My Booking History

**GET** `/api/bookings/my-requests`

Get all your parking requests and booking history.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "bookings": [...]
}
```

---

## 📦 Database Tables

### `bookings` Table Structure

```
id (UUID, Primary Key)
spot_id (UUID, FK to spots)
user_id (UUID, FK to profiles)
owner_id (UUID, FK to profiles)
vehicle_number (Text)
vehicle_type (Car/Bike/Scooter/Truck)
booking_date (Date)
status (pending/active/completed/cancelled)
amount (Numeric)
created_at (Timestamp)
```

### Booking Workflow

```
User Request
    ↓
pending (Land owner sees in dashboard)
    ↓
Land Owner Decision
    ├─→ Approve → active (confirmed booking)
    └─→ Reject → cancelled (denied booking)
```

---

## 🔐 Authentication

All endpoints require Bearer token authentication.

**Get Token from Frontend:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session.access_token;
```

**Send in Request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Error Handling

**400 - Bad Request**
```json
{
  "error": "Missing required fields"
}
```

**403 - Forbidden**
```json
{
  "error": "Unauthorized - This booking belongs to another owner"
}
```

**404 - Not Found**
```json
{
  "error": "Booking not found"
}
```

**500 - Server Error**
```json
{
  "error": "Failed to create booking request"
}
```

---

## 💡 Usage Example (Frontend)

```javascript
// 1. USER: Request parking
const requestParking = async (spotId, vehicleData) => {
  const response = await fetch('http://localhost:5001/api/bookings/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      spot_id: spotId,
      vehicle_number: vehicleData.vehicleNumber,
      vehicle_type: vehicleData.vehicleType,
      booking_date: new Date().toISOString().split('T')[0],
      amount: 300
    })
  });
  return response.json();
};

// 2. LAND OWNER: Get pending requests
const getPendingRequests = async () => {
  const response = await fetch('http://localhost:5001/api/bookings/pending-requests', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  });
  return response.json();
};

// 3. LAND OWNER: Approve request
const approveParking = async (bookingId) => {
  const response = await fetch(`http://localhost:5001/api/bookings/approve/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  });
  return response.json();
};
```

---

## 📝 Notes

- All timestamps are in UTC (Zulu time)
- Status flow: `pending` → `active`/`cancelled` → `completed`
- Users can only request parking to active spots
- Land owners can only manage their own bookings
- Row Level Security (RLS) enforced at database level

---

## 🚀 Next Steps

1. Apply the database schema: `Database/landowner_schema.sql`
2. Install dependencies: `npm install`
3. Set up `.env` file with Supabase credentials
4. Run: `npm run dev`
5. Frontend can now call these endpoints!

---

**Happy parking! 🎉**
