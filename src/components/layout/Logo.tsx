
import { Milk } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
      <Milk className="h-7 w-7" />
      <span className="group-data-[collapsible=icon]:hidden">SAJ Foods Limited</span>
    </Link>
  );
}

