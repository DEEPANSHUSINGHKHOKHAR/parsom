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
  PanelsTopLeft,
  Scissors,
  ShoppingBag,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Coupons', href: '/coupons', icon: Gift },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Return Requests', href: '/return-requests', icon: Inbox },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Notify Requests', href: '/notify-requests', icon: Inbox },
  { label: 'Storefront', href: '/storefront', icon: PanelsTopLeft },
  { label: 'Stitch Requests', href: '/stitch-requests', icon: Scissors },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Contact Requests', href: '/contact-submissions', icon: MessageSquare },
  { label: 'Wishlist Insights', href: '/wishlist-insights', icon: Heart },
  { label: 'Recycle Bin', href: '/recycle-bin', icon: Trash2 },
];

export default function AdminSidebar() {
  return (
    <aside className="rounded-[8px] border border-[#ded5ca] bg-[#fffaf4] p-4 shadow-[0_18px_45px_rgba(23,20,18,0.08)]">
      <div className="mb-5 flex items-center gap-3 border-b border-[#ded5ca] pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#171412] text-[#fffaf4]">
          <Boxes size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#171412]">Workspace</p>
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
                    ? 'rounded-[8px] border border-[#8f3d2f] bg-[#8f3d2f] font-semibold text-white shadow-[0_10px_28px_rgba(143,61,47,0.24)]'
                    : 'rounded-[8px] text-[#574f48] hover:bg-[#f4efe8] hover:text-[#171412]',
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
