// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liar Game',
  description: 'A real-time multiplayer liar game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
