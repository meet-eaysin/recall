'use client';

import Link from 'next/link';
import { Badge } from '../ui/badge';

export default function UnconfirmedBookingBadge() {
  return (
    <Link href="/bookings/unconfirmed">
      <Badge
        title={''}
        variant="success"
        className="cursor-pointer hover:bg-orange-800 hover:text-orange-100"
      >
        Test
      </Badge>
    </Link>
  );
}
