import { ReactNode } from 'react';
import './bynodo-variables.css';
import './bynodo.css';

export default function ByNodoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bynodo-layout">
      {children}
    </div>
  );
}
