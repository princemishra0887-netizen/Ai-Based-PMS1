import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

export default function bookingRoutes(supabase) {
  const router = express.Router();

  // 1. USER: Request parking from land owner
  router.post('/request', authenticateToken, async (req, res) => {
    try {
      const { spot_id, vehicle_number, vehicle_type, vehicle_brand, vehicle_color, booking_date, start_time, end_time, booking_type, amount, notes } = req.body;
      const user_id = req.user.id;

      // Validate input
      if (!spot_id || !vehicle_number || !vehicle_type || !booking_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get spot details to find owner_id
      const { data: spot, error: spotError } = await supabase
        .from('spots')
        .select('owner_id')
        .eq('id', spot_id)
        .single();

      if (spotError || !spot) {
        return res.status(404).json({ error: 'Spot not found' });
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, email')
        .eq('id', user_id)
        .single();

      if (userError) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Create booking request with status 'pending'
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          spot_id,
          user_id,
          owner_id: spot.owner_id,
          vehicle_number,
          vehicle_type,
          vehicle_brand,
          vehicle_color,
          user_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          user_phone: userData.phone,
          booking_date,
          start_time,
          end_time,
          booking_type: booking_type || 'hourly',
          amount,
          status: 'pending',
          payment_status: 'pending',
          notes
        }])
        .select();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        return res.status(500).json({ error: 'Failed to create booking request' });
      }

      res.status(201).json({
        success: true,
        message: 'Parking request sent to land owner',
        booking: booking[0]
      });

    } catch (error) {
      console.error('Error in /request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. LAND OWNER: Get all pending requests for their spots
  router.get('/pending-requests', authenticateToken, async (req, res) => {
    try {
      const owner_id = req.user.id;

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          spot_id,
          user_id,
          vehicle_number,
          vehicle_type,
          vehicle_brand,
          vehicle_color,
          user_name,
          user_phone,
          booking_date,
          start_time,
          end_time,
          booking_type,
          amount,
          status,
          notes,
          created_at,
          spots(name, address, city)
        `)
        .eq('owner_id', owner_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ error: 'Failed to fetch pending requests' });
      }

      res.json({
        success: true,
        count: bookings.length,
        requests: bookings
      });

    } catch (error) {
      console.error('Error in /pending-requests:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. LAND OWNER: Approve a parking request
  router.put('/approve/:booking_id', authenticateToken, async (req, res) => {
    try {
      const { booking_id } = req.params;
      const owner_id = req.user.id;

      // Verify booking belongs to this owner
      const { data: booking, error: checkError } = await supabase
        .from('bookings')
        .select('owner_id, status, spot_id, amount')
        .eq('id', booking_id)
        .single();

      if (checkError || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.owner_id !== owner_id) {
        return res.status(403).json({ error: 'Unauthorized - This booking belongs to another owner' });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ error: `Cannot approve - booking status is ${booking.status}` });
      }

      // Update booking status to 'active'
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'active',
          payment_status: 'pending'
        })
        .eq('id', booking_id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Failed to approve booking' });
      }

      // Update spot statistics
      const { error: spotError } = await supabase
        .from('spots')
        .update({
          total_bookings: booking.spot_id ? await getSpotBookingCount(booking.spot_id) : 0,
          total_revenue: booking.spot_id ? (booking.amount || 0) : 0
        })
        .eq('id', booking.spot_id);

      res.json({
        success: true,
        message: 'Parking request approved ✓',
        booking: updatedBooking[0]
      });

    } catch (error) {
      console.error('Error in /approve:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. LAND OWNER: Reject a parking request
  router.put('/reject/:booking_id', authenticateToken, async (req, res) => {
    try {
      const { booking_id } = req.params;
      const { reason } = req.body;
      const owner_id = req.user.id;

      // Verify booking belongs to this owner
      const { data: booking, error: checkError } = await supabase
        .from('bookings')
        .select('owner_id, status')
        .eq('id', booking_id)
        .single();

      if (checkError || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.owner_id !== owner_id) {
        return res.status(403).json({ error: 'Unauthorized - This booking belongs to another owner' });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ error: `Cannot reject - booking status is ${booking.status}` });
      }

      // Update booking status to 'cancelled'
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: reason || 'Rejected by land owner'
        })
        .eq('id', booking_id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Failed to reject booking' });
      }

      res.json({
        success: true,
        message: 'Parking request rejected ✗',
        booking: updatedBooking[0]
      });

    } catch (error) {
      console.error('Error in /reject:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. LAND OWNER: Get all bookings (active, completed, cancelled)
  router.get('/my-bookings', authenticateToken, async (req, res) => {
    try {
      const owner_id = req.user.id;
      const { status } = req.query;

      let query = supabase
        .from('bookings')
        .select(`
          id,
          spot_id,
          user_id,
          vehicle_number,
          vehicle_type,
          user_name,
          user_phone,
          booking_date,
          start_time,
          end_time,
          amount,
          status,
          payment_status,
          created_at,
          spots(name, address)
        `)
        .eq('owner_id', owner_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookings, error } = await query;

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });

    } catch (error) {
      console.error('Error in /my-bookings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 6. USER: Get my booking history
  router.get('/my-requests', authenticateToken, async (req, res) => {
    try {
      const user_id = req.user.id;

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          spot_id,
          vehicle_number,
          vehicle_type,
          booking_date,
          start_time,
          end_time,
          amount,
          status,
          payment_status,
          created_at,
          spots(name, address, city, owner_id)
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch booking history' });
      }

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });

    } catch (error) {
      console.error('Error in /my-requests:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

// Helper function
async function getSpotBookingCount(spot_id) {
  // This would be implemented based on your logic
  return 0;
}
