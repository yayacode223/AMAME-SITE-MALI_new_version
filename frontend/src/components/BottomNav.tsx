import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Award, Trophy, Compass, MoreHorizontal,
  Newspaper, Image, Info, Users, Building2,
  LogIn, UserPlus, LayoutDashboard, LogOut,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetClose, SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';

/* ── Onglets principaux ──────────────────────────────────────────── */
const PRIMARY_TABS = [
  { path: '/',           label: 'Accueil',     icon: Home,    exact: true  },
  { path: '/bourses',    label: 'Bourses',     icon: Award,   exact: false },
  { path: '/concours',   label: 'Concours',    icon: Trophy,  exact: false },
  { path: '/orientation',label: 'Orientation', icon: Compass, exact: false },
];

/* ── Contenu du menu "Plus" ──────────────────────────────────────── */
const PLUS_SECTIONS = [
  {
    title: 'Actualités',
    items: [
      { path: '/articles', label: 'Articles',  icon: Newspaper },
      { path: '/galeries', label: 'Galeries',  icon: Image     },
    ],
  },
  {
    title: 'À Propos',
    items: [
      { path: '/a-propos',              label: 'À Propos',   icon: Info      },
      { path: '/a-propos/membres',      label: 'Membres',    icon: Users     },
      { path: '/a-propos/partenaires',  label: 'Partenaires',icon: Building2 },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function useIsActive(pathname: string) {
  return (path: string, exact = false) =>
    exact ? pathname === path : pathname.startsWith(path);
}

function itemClass(active: boolean) {
  return [
    'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors',
    active ? 'text-amame-green bg-amame-green-subtle' : 'text-gray-700 hover:bg-gray-50',
  ].join(' ');
}

/* ── Composant principal ─────────────────────────────────────────── */
export function BottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout, isLoggingOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isActive = useIsActive(pathname);

  const isPlusActive = PLUS_SECTIONS
    .flatMap(s => s.items)
    .some(i => pathname.startsWith(i.path));

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'EDITOR';
  const hasMemberAccess = ['MEMBER', 'ADMIN', 'SUPERADMIN', 'EDITOR'].includes(user?.role ?? '');

  const handleLogout = async () => {
    setSheetOpen(false);
    await logout();
  };

  return (
    /* Visibilitée mobile uniquement (< lg = < 1024px, cohérent avec Navbar) */
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation mobile"
    >
      <div className="flex h-16">

        {/* Onglets primaires */}
        {PRIMARY_TABS.map(({ path, label, icon: Icon, exact }) => {
          const active = isActive(path, exact);
          return (
            <Link
              key={path}
              to={path}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'text-[10px] font-semibold tracking-tight transition-colors',
                active ? 'text-amame-green' : 'text-gray-400',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={['h-[22px] w-[22px]', active ? 'stroke-[2.5]' : 'stroke-[1.75]'].join(' ')}
              />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Onglet "Plus" → Sheet bottom */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'text-[10px] font-semibold tracking-tight transition-colors',
                isPlusActive || sheetOpen ? 'text-amame-green' : 'text-gray-400',
              ].join(' ')}
              aria-label="Afficher plus de liens"
            >
              <MoreHorizontal
                className={[
                  'h-[22px] w-[22px]',
                  isPlusActive || sheetOpen ? 'stroke-[2.5]' : 'stroke-[1.75]',
                ].join(' ')}
              />
              <span>Plus</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="rounded-t-2xl p-0 max-h-[82vh] overflow-y-auto"
            /* Padding bas = hauteur BottomNav pour ne pas masquer le contenu */
            style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Poignée visuelle */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pb-4 space-y-0.5">

              {/* Sections Actualités & À Propos */}
              {PLUS_SECTIONS.map(section => (
                <div key={section.title}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-1.5">
                    {section.title}
                  </p>
                  {section.items.map(({ path, label, icon: Icon }) => (
                    <SheetClose asChild key={path}>
                      <Link to={path} className={itemClass(pathname.startsWith(path))}>
                        <Icon className="h-5 w-5 shrink-0" />
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              ))}

              {/* Adhésion */}
              {!isAuthenticated && (
                <SheetClose asChild>
                  <Link to="/adhesion" className={itemClass(pathname === '/adhesion')}>
                    <UserPlus className="h-5 w-5 shrink-0 text-amame-green" />
                    <span className="text-amame-green font-semibold">Adhérer à l'AMAME</span>
                  </Link>
                </SheetClose>
              )}

              {/* Séparateur auth */}
              <div className="border-t border-gray-100 pt-3 mt-2 space-y-1">
                {isAuthenticated && user ? (
                  <>
                    {/* Nom utilisateur */}
                    <div className="px-3 pb-2">
                      <p className="text-sm font-semibold text-gray-800">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {isAdmin && (
                      <SheetClose asChild>
                        <Link to="/admin" className={itemClass(pathname.startsWith('/admin'))}>
                          <LayoutDashboard className="h-5 w-5 shrink-0 text-amame-green" />
                          Dashboard Admin
                        </Link>
                      </SheetClose>
                    )}

                    {hasMemberAccess && (
                      <SheetClose asChild>
                        <Link to="/membre/dashboard" className={itemClass(pathname.startsWith('/membre'))}>
                          <LayoutDashboard className="h-5 w-5 shrink-0 text-amame-green" />
                          Mon espace membre
                        </Link>
                      </SheetClose>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <SheetClose asChild>
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold border border-amame-green text-amame-green hover:bg-amame-green-subtle transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        Connexion
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>

            </div>
          </SheetContent>
        </Sheet>

      </div>
    </nav>
  );
}

export default BottomNav;
