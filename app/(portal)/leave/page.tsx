// app/(portal)/leave/page.tsx
import { redirect } from 'next/navigation';

export default function LeaveIndexPage() {
  redirect('/leave/balance');
}
