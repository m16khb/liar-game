// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { Button } from '@liar-game/ui';
import { GAME_RULES } from '@liar-game/constants';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Liar Game</h1>
      <p>플레이어 수: {GAME_RULES.MIN_PLAYERS} - {GAME_RULES.MAX_PLAYERS}명</p>
      <Button variant="primary">게임 시작</Button>
    </main>
  );
}
