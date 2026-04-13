# 🚀 Quick Start Guide - Backend Setup

## What We Created

✅ **Parking Request System** - Users request parking, Land owners approve/reject  
✅ **Real-time Management** - Supabase integration for live data  
✅ **Secure Authentication** - Token-based API access  

---

## 📁 File Structure Created

```
Backend/
├── server.js                     # Main Express server
├── package.json                  # Dependencies (updated with Supabase)
├── .env.example                  # Environment template
├── routes/
│   └── bookings.js              # All booking endpoints
├── middleware/
│   └── auth.js                  # Token authentication
└── README.md                     # Full API documentation
```

---

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
cd Backend
npm install
```

This will install:
- `express` - Web framework
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `@supabase/supabase-js` - Supabase client

### Step 2: Create `.env` File

Copy `.env.example` and rename to `.env`:

```bash
cp .env.example .env
```

**Fill in your Supabase credentials:**

```
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
NODE_ENV=development
```

Get these from: https://app.supabase.com → Project Settings → API

### Step 3: Start the Backend

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
🚗 ParkEase Backend running on port 5001
```

---

## 📊 How It Works

### Booking Request Flow

```
┌─────────────┐
│   USER      │
│  Requests   │
│   Parking   │
└──────┬──────┘
       │ POST /api/bookings/request
       ↓
┌─────────────────────────┐
│  Booking Created        │
│  Status: "pending"      │
│  (Stored in Database)   │
└──────┬──────────────────┘
       │
       ↓
┌───────────────────────────────┐
│  LAND OWNER Dashboard         │
│  GET /api/bookings/pending... │
│  Shows Pending Requests       │
└──────┬──────────────────────┬─┘
       │                      │
  APPROVE               REJECT
   (PUT)                 (PUT)
       │                  │
       ↓                  ↓
   Active          Cancelled
   Status          Status
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Who Uses | Purpose |
|--------|----------|----------|---------|
| POST | `/api/bookings/request` | User | Request parking |
| GET | `/api/bookings/pending-requests` | Owner | View pending requests |
| PUT | `/api/bookings/approve/:id` | Owner | Approve request |
| PUT | `/api/bookings/reject/:id` | Owner | Reject request |
| GET | `/api/bookings/my-bookings` | Owner | View all bookings |
| GET | `/api/bookings/my-requests` | User | View my requests |

---

## 🧪 Test the API

### Using Postman or cURL

**1. Request Parking (User)**

```bash
curl -X POST http://localhost:5001/api/bookings/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spot_id": "uuid-here",
    "vehicle_number": "UP 14 AB 1234",
    "vehicle_type": "Car",
    "booking_date": "2025-03-20",
    "amount": 300
  }'
```

**2. Get Pending Requests (Owner)**

```bash
curl -X GET http://localhost:5001/api/bookings/pending-requests \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Approve Request (Owner)**

```bash
curl -X PUT http://localhost:5001/api/bookings/approve/booking-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Integration with Frontend

Update your React app to use the backend:

```javascript
// Frontend Code Example
const userToken = 'YOUR_AUTH_TOKEN'; // From Supabase

// Request parking
const response = await fetch('http://localhost:5001/api/bookings/request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    spot_id: selectedSpot.id,
    vehicle_number: 'UP 14 AB 1234',
    vehicle_type: 'Car',
    booking_date: new Date().toISOString().split('T')[0],
    amount: 300
  })
});

const result = await response.json();
if (result.success) {
  alert('Parking request sent! ✓');
}
```

---

## 📝 Database Requirements

Make sure you've applied the schema from `Database/landowner_schema.sql`:

```sql
-- Tables needed:
- public.profiles   -- User/Owner info
- public.spots      -- Parking spaces
- public.bookings   -- Booking requests
- public.spot_reviews -- Reviews
```

Run this in Supabase SQL Editor if not done yet.

---

## 🔒 Authentication Notes

- All endpoints require **Bearer Token** from Supabase Auth
- Token is included in `Authorization` header
- Format: `Authorization: Bearer eyJhbGciOiJIUzI1NiI...`

---

## ✅ Checklist

- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created with Supabase credentials
- [ ] Database schema applied (`landowner_schema.sql`)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend can call `/api/bookings` endpoints
- [ ] Land owner dashboard shows pending requests
- [ ] Approve/Reject buttons work

---

## 🐛 Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js
```

**Error: "Invalid or expired token"**
- Make sure the token is fresh (not expired)
- Use `Authorization: Bearer ` (with space after Bearer)

**Error: "Spot not found"**
- Verify the spot_id exists in database
- Check that spot status is "active"

---

## 📖 More Details

See [Backend/README.md](./README.md) for complete API documentation.

---

**Your Express backend is ready! 🎉**

Next: Update your Frontend to integrate with these API endpoints.
