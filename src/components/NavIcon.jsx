function NavIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-7h5v7" />
      </>
    ),
    inventory: (
      <>
        <path d="M4 5h16v5H4z" />
        <path d="M4 14h7v6H4zM15 14h5v6h-5z" />
        <path d="M8 7.5h8M7.5 17h0M17.5 17h0" />
      </>
    ),
    shopping: (
      <>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
        <circle cx="9.5" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    stock: (
      <>
        <path d="M4 10h16l-1.4 9H5.4L4 10Z" />
        <path d="m8 10 4-6 4 6M8 14v2M12 14v2M16 14v2" />
      </>
    ),
    prep: (
      <>
        <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
        <circle cx="16.5" cy="8" r="1" />
        <path d="M8 8.5h4M8 12h8M8 15.5h6" />
      </>
    ),
    chevron: <path d="m7.5 9 4.5 4.5L16.5 9" />,
    add: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    use: (
      <>
        <path d="M4 11h13a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
        <path d="M17 11h4M7 15v3M14 15v3M6 7c0-1 1-1 1-2M11 7c0-1 1-1 1-2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default NavIcon;
