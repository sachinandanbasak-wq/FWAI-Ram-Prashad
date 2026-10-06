export type NavItem = {
  label: string;
  href: string;
  /** ready = built now; false = scheduled for a later phase (shown as "Soon"). */
  ready: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/", ready: true },
      { label: "Requirements", href: "/requirements", ready: true },
      { label: "OEMs & Suppliers", href: "/masters/oems", ready: true },
      { label: "Quotations", href: "/quotations", ready: false },
      { label: "Orders", href: "/orders", ready: false },
      { label: "Fulfilment", href: "/fulfilment", ready: false },
      { label: "PDI", href: "/pdi", ready: false },
      { label: "Deliveries", href: "/deliveries", ready: false },
      { label: "Payments", href: "/payments", ready: false },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Follow-ups", href: "/follow-ups", ready: true },
      { label: "Historical Intelligence", href: "/historical", ready: false },
      { label: "Ask Your Business", href: "/ask", ready: false },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Documents", href: "/documents", ready: false },
      { label: "Masters", href: "/masters", ready: true },
      { label: "Settings", href: "/settings", ready: true },
    ],
  },
];
