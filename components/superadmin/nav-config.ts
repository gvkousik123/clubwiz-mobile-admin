import {
  Building2,
  CreditCard,
  Images,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Percent,
  Radio,
  RotateCcw,
  Tag,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Permission } from '@/lib/auth/roles';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Sections whose backend endpoints do not exist yet. */
  pendingBackend?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const SUPERADMIN_NAV: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        href: '/bz/superadmin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'platform.dashboard.view',
      },
      // Not in the design, but the endpoints exist and this is the only place
      // roles can be granted — dropping it would lose working functionality.
      {
        href: '/bz/superadmin/users',
        label: 'Users & roles',
        icon: Users,
        permission: 'users.viewAll',
      },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { href: '/bz/superadmin/clubs', label: 'Clubs', icon: Building2, permission: 'clubs.viewAll' },
      {
        href: '/bz/superadmin/payouts',
        label: 'Payouts',
        icon: CreditCard,
        permission: 'payouts.view',
      },
      {
        href: '/bz/superadmin/commissions',
        label: 'Commissions',
        icon: Percent,
        permission: 'commissions.view',
      },
      {
        href: '/bz/superadmin/refunds',
        label: 'Refunds',
        icon: RotateCcw,
        permission: 'refunds.view',
      },
      {
        href: '/bz/superadmin/carousel',
        label: 'Event carousel',
        icon: Images,
        permission: 'carousel.manage',
      },
      { href: '/bz/superadmin/ads', label: 'Ads', icon: Megaphone, permission: 'ads.manage' },
      {
        href: '/bz/superadmin/post-on-behalf',
        label: 'Post on behalf',
        icon: UserPlus,
        permission: 'content.postOnBehalf',
      },
      { href: '/bz/superadmin/promos', label: 'Promo codes', icon: Tag, permission: 'promos.manage' },
      {
        href: '/bz/superadmin/broadcasts',
        label: 'Broadcasts',
        icon: Radio,
        permission: 'broadcasts.send',
        pendingBackend: true,
      },
      {
        href: '/bz/superadmin/support',
        label: 'Support',
        icon: MessageSquare,
        permission: 'support.view',
      },
    ],
  },
];

/** Page chrome copy, keyed by pathname. */
export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/bz/superadmin': { title: 'Dashboard', subtitle: 'Platform health across all clubs and events' },
  '/bz/superadmin/users': {
    title: 'Users & roles',
    subtitle: 'Platform accounts and role assignment',
  },
  '/bz/superadmin/clubs': { title: 'Clubs', subtitle: 'Every club on the platform' },
  '/bz/superadmin/payouts': {
    title: 'Payouts & settlements',
    subtitle: 'Weekend settlement cycle',
  },
  '/bz/superadmin/commissions': {
    title: 'Commissions',
    subtitle: 'Per-club partnership rate applied on every payout',
  },
  '/bz/superadmin/refunds': {
    title: 'Refunds & disputes',
    subtitle: 'Customer refund requests and chargebacks',
  },
  '/bz/superadmin/carousel': {
    title: 'Event carousel',
    subtitle: 'Featured events on the app home screen',
  },
  '/bz/superadmin/ads': { title: 'Ads', subtitle: 'Promotional banners shown across the app' },
  '/bz/superadmin/post-on-behalf': {
    title: 'Post on behalf',
    subtitle: 'Create events or upload stories for a club',
  },
  '/bz/superadmin/promos': {
    title: 'Promo codes',
    subtitle: 'Site-wide and club-specific discounts',
  },
  '/bz/superadmin/broadcasts': {
    title: 'Broadcasts',
    subtitle: 'Push notifications to the Clubwiz audience',
  },
  '/bz/superadmin/support': {
    title: 'Support tickets',
    subtitle: 'Club-owner and customer support inbox',
  },
};
