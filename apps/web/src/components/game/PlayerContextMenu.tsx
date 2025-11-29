// 플레이어 컨텍스트 메뉴 컴포넌트
// 우클릭 시 표시되는 방장 위임 메뉴

import { Player, ContextMenuState } from '../../types/game'

interface PlayerContextMenuProps {
  contextMenu: ContextMenuState
  onTransferHost: (player: Player) => void
  onClose: () => void
}

export default function PlayerContextMenu({
  contextMenu,
  onTransferHost,
  onClose
}: PlayerContextMenuProps) {
  if (!contextMenu.visible || !contextMenu.targetPlayer) {
    return null
  }

  const handleClick = () => {
    onTransferHost(contextMenu.targetPlayer!)
    onClose()
  }

  return (
    <div
      className="fixed bg-arcade-dark border-3 border-arcade-cyan shadow-[0_0_30px_rgba(5,217,232,0.4)] py-2 z-50 min-w-[180px]"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <button
        onClick={handleClick}
        className="w-full px-4 py-2.5 text-left font-retro text-retro-base text-arcade-cyan flex items-center gap-2 hover:bg-arcade-purple/50 hover:text-arcade-yellow transition-colors cursor-pointer"
      >
        <span>👑</span>
        <span>방장 위임</span>
        <span className="ml-auto font-pixel text-pixel-xs text-arcade-yellow">
          {contextMenu.targetPlayer.nickname || `플레이어 ${contextMenu.targetPlayer.userId}`}
        </span>
      </button>
    </div>
  )
}
