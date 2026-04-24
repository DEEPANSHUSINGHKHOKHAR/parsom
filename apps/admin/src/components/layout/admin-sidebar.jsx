import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  FolderTree,
  Gift,
  Heart,
  Inbox,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  Wrench,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Coupons', href: '/coupons', icon: Gift },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Notify Requests', href: '/notify-requests', icon: Inbox },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Contact Requests', href: '/contact-submissions', icon: MessageSquare },
  { label: 'Wishlist Insights', href: '/wishlist-insights', icon: Heart },
];

export default function AdminSidebar() {
  return (
    <aside className="border border-white/10 bg-[#111214] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="grid h-10 w-10 place-items-center bg-[#e7ded2] text-[#0a0a0b]">
          <Boxes size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Workspace</p>
          <p className="text-xs text-[#8b847b]">Operations</p>
        </div>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-3 text-sm transition',
                  isActive
                    ? 'bg-[#e7ded2] text-[#0a0a0b]'
                    : 'text-[#b9b2a9] hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
