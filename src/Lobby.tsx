import { Link } from "react-router-dom";

export default function Lobby() {
  return (
    <ul
      role="list"
      className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
    >
      <li>
        <Link to="sandbox">
          <LobbyEntry>Sandbox</LobbyEntry>
        </Link>
      </li>
    </ul>
  );
}

const LobbyEntry = ({ children = "" }) => (
  <button
    type="button"
    className="p-16 text-xs font-semibold text-gray-900 bg-white rounded shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
  >
    {children}
  </button>
);
